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
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET!);
    console.log('Token generado:', token);
    res.json({ token });
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
          rol: usuario.rol
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
             COUNT(con.id) as total_contenidos,
             AVG(pu.puntuacion) as puntuacion_promedio
      FROM cursos c
      LEFT JOIN contenidos con ON c.id = con.curso_id
      LEFT JOIN progreso_usuario pu ON c.id = pu.curso_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
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