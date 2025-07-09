import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.post('/register', async (req, res) => {
  const { nombre, email, contraseña } = req.body;
  console.log('Datos recibidos:', { nombre, email, contraseña });
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    console.log('Contraseña hasheada:', hashedPassword);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, contraseña) VALUES ($1, $2, $3) RETURNING id',
      [nombre, email, hashedPassword]
    );
    console.log('Resultado de inserción:', result.rows);
    const token = jwt.sign({ id: result.rows[0].id, learningStyle: null }, process.env.JWT_SECRET!);
    console.log('Token generado:', token);
    res.json({ token, user: { id: result.rows[0].id, nombre, email, learningStyle: null } });
  } catch (error) {
    console.error('Error en /register:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];
    if (usuario && await bcrypt.compare(contraseña, usuario.contraseña)) {
      const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET!);
      res.json({ 
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          learningStyle: usuario.learning_style
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/perfil', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const result = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id = $1', [decoded.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.put('/perfil/actualizar', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const { nombre, email, learningStyle } = req.body;

    // Construir la consulta de actualización dinámicamente
    let query = 'UPDATE usuarios SET';
    const params = [];
    let paramIndex = 1;

    if (nombre) {
      query += ` nombre = ${paramIndex++},`;
      params.push(nombre);
    }
    if (email) {
      query += ` email = ${paramIndex++},`;
      params.push(email);
    }
    if (learningStyle) {
      query += ` learning_style = ${paramIndex++},`;
      params.push(learningStyle);
    }

    // Eliminar la última coma si hay campos para actualizar
    if (params.length > 0) {
      query = query.slice(0, -1); // Eliminar la última coma
      query += ` WHERE id = ${paramIndex++} RETURNING id, nombre, email, learning_style;`;
      params.push(decoded.id);

      const result = await pool.query(query, params);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
      }
    } else {
      res.status(400).json({ error: 'No hay campos para actualizar' });
    }

  } catch (error) {
    console.error('Error en /perfil/actualizar:', error);
    res.status(401).json({ error: 'Token inválido o error en el servidor' });
  }
});

app.get('/lecciones/:cursoId', async (req, res) => {
  try {
    const { cursoId } = req.params;
    const result = await pool.query('SELECT * FROM lecciones WHERE curso_id = $1 ORDER BY orden ASC', [cursoId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo lecciones:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/lecciones/:leccionId/contenido/:tipoAprendizaje', async (req, res) => {
  try {
    const { leccionId, tipoAprendizaje } = req.params;
    const result = await pool.query(
      'SELECT * FROM contenido_leccion WHERE leccion_id = $1 AND tipo_aprendizaje = $2',
      [leccionId, tipoAprendizaje]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo contenido de lección:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/lecciones/:leccionId/quiz', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = decoded.id;
    const { leccionId } = req.params;
    const { score, cursoId } = req.body; // Asumo que el frontend envía el score y el cursoId

    // Guardar el progreso del usuario y la puntuación
    await pool.query(
      'INSERT INTO progreso_usuario (usuario_id, curso_id, leccion_id, puntuacion, completado) VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (usuario_id, leccion_id) DO UPDATE SET puntuacion = EXCLUDED.puntuacion, completado = EXCLUDED.completado',
      [userId, cursoId, leccionId, score]
    );

    // Lógica para cambiar el estilo de aprendizaje si el puntaje es bajo
    if (score < 70) { // Umbral para cambiar el estilo de aprendizaje
      const learningStyles = ['visual', 'auditivo', 'verbal', 'quinestesico'];
      const currentLearningStyleResult = await pool.query('SELECT learning_style FROM usuarios WHERE id = $1', [userId]);
      const currentLearningStyle = currentLearningStyleResult.rows[0]?.learning_style;

      let newLearningStyle = currentLearningStyle;
      if (currentLearningStyle) {
        const currentIndex = learningStyles.indexOf(currentLearningStyle);
        newLearningStyle = learningStyles[(currentIndex + 1) % learningStyles.length]; // Rotar al siguiente estilo
      } else {
        newLearningStyle = learningStyles[0]; // Si no tiene estilo, asignar el primero
      }

      await pool.query('UPDATE usuarios SET learning_style = $1 WHERE id = $2', [newLearningStyle, userId]);
      res.json({ message: 'Quiz completado y estilo de aprendizaje actualizado', newLearningStyle });
    } else {
      res.json({ message: 'Quiz completado' });
    }

  } catch (error) {
    console.error('Error al procesar quiz:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/contenido', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contenido');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener cursos
app.get('/cursos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             COUNT(l.id) as total_contenidos,
             AVG(pu.puntuacion) as puntuacion_promedio
      FROM cursos c
      LEFT JOIN lecciones l ON c.id = l.curso_id
      LEFT JOIN progreso_usuario pu ON c.id = pu.curso_id
      GROUP BY c.id, c.titulo, c.descripcion, c.categoria, c.nivel, c.instructor
      ORDER BY c.id DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener progreso del usuario
app.get('/progreso/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT c.titulo, c.categoria, pu.completado, pu.puntuacion, pu.fecha_completado
      FROM progreso_usuario pu
      JOIN cursos c ON pu.curso_id = c.id
      WHERE pu.usuario_id = $1
      ORDER BY pu.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener estadísticas del dashboard
app.get('/dashboard-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const totalCursos = await pool.query('SELECT COUNT(*) FROM cursos');
    const cursosCompletados = await pool.query(
      'SELECT COUNT(*) FROM progreso_usuario WHERE usuario_id = $1 AND completado = true',
      [userId]
    );
    const promedioNotas = await pool.query(
      'SELECT AVG(puntuacion) FROM progreso_usuario WHERE usuario_id = $1 AND puntuacion IS NOT NULL',
      [userId]
    );
    
    res.json({
      totalCursos: parseInt(totalCursos.rows[0].count),
      cursosCompletados: parseInt(cursosCompletados.rows[0].count),
      promedioNotas: parseFloat(promedioNotas.rows[0].avg) || 0
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.listen(3001, () => console.log('Backend corriendo en puerto 3001')); 