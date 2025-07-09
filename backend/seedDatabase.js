const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'aplicacion_aprendizaje',
  port: process.env.DB_PORT || 5432,
});

async function seedDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Crear tablas adicionales para el contenido de aprendizaje
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(100),
        duracion_minutos INTEGER,
        nivel VARCHAR(50),
        instructor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contenidos (
        id SERIAL PRIMARY KEY,
        curso_id INTEGER REFERENCES cursos(id),
        titulo VARCHAR(255) NOT NULL,
        tipo VARCHAR(50),
        contenido TEXT,
        orden INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS progreso_usuario (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        curso_id INTEGER REFERENCES cursos(id),
        contenido_id INTEGER REFERENCES contenidos(id),
        completado BOOLEAN DEFAULT FALSE,
        fecha_completado TIMESTAMP,
        puntuacion INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tablas creadas/verificadas');

    // Insertar usuarios de ejemplo
    const usuarios = [
      ['María García', 'maria@demo.com', 'password123', 'student'],
      ['Carlos López', 'carlos@demo.com', 'password123', 'student'],
      ['Ana Martínez', 'ana@demo.com', 'password123', 'instructor'],
      ['Luis Rodríguez', 'luis@demo.com', 'password123', 'student'],
      ['Sofia Chen', 'sofia@demo.com', 'password123', 'instructor']
    ];

    for (const [nombre, email, pass, rol] of usuarios) {
      const hashedPassword = await bcrypt.hash(pass, 10);
      await pool.query(`
        INSERT INTO usuarios (nombre, email, contraseña, rol) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (email) DO NOTHING
      `, [nombre, email, hashedPassword, rol]);
    }

    console.log('Usuarios de ejemplo creados');

    // Insertar cursos de ejemplo
    const cursos = [
      ['Introducción a JavaScript', 'Aprende los fundamentos de JavaScript desde cero', 'Programación', 120, 'Principiante', 'Ana Martínez'],
      ['React Avanzado', 'Domina React y construye aplicaciones complejas', 'Programación', 180, 'Avanzado', 'Sofia Chen'],
      ['Base de Datos SQL', 'Aprende a diseñar y consultar bases de datos', 'Base de Datos', 150, 'Intermedio', 'Ana Martínez'],
      ['Python para Ciencia de Datos', 'Análisis de datos con Python y pandas', 'Data Science', 200, 'Intermedio', 'Sofia Chen'],
      ['Diseño UX/UI', 'Principios de diseño de experiencia de usuario', 'Diseño', 90, 'Principiante', 'Ana Martínez']
    ];

    for (const curso of cursos) {
      const result = await pool.query(`
        INSERT INTO cursos (titulo, descripcion, categoria, duracion_minutos, nivel, instructor) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        ON CONFLICT DO NOTHING
        RETURNING id
      `, curso);
      
      if (result.rows.length > 0) {
        const cursoId = result.rows[0].id;
        
        // Insertar contenidos para cada curso
        const contenidos = [
          [cursoId, 'Introducción al tema', 'video', 'Contenido introductorio del curso', 1],
          [cursoId, 'Conceptos básicos', 'texto', 'Explicación de conceptos fundamentales', 2],
          [cursoId, 'Ejercicio práctico 1', 'ejercicio', 'Primer ejercicio práctico', 3],
          [cursoId, 'Conceptos avanzados', 'video', 'Temas más complejos del curso', 4],
          [cursoId, 'Proyecto final', 'proyecto', 'Proyecto integrador del curso', 5]
        ];

        for (const contenido of contenidos) {
          await pool.query(`
            INSERT INTO contenidos (curso_id, titulo, tipo, contenido, orden) 
            VALUES ($1, $2, $3, $4, $5)
          `, contenido);
        }
      }
    }

    console.log('Cursos y contenidos creados');

    // Insertar progreso de ejemplo
    const usuarios_result = await pool.query('SELECT id FROM usuarios WHERE rol = $1', ['student']);
    const cursos_result = await pool.query('SELECT id FROM cursos');

    for (const usuario of usuarios_result.rows) {
      for (const curso of cursos_result.rows.slice(0, 2)) {
        await pool.query(`
          INSERT INTO progreso_usuario (usuario_id, curso_id, completado, puntuacion) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [usuario.id, curso.id, Math.random() > 0.5, Math.floor(Math.random() * 100)]);
      }
    }

    console.log('Progreso de usuarios creado');
    console.log('¡Base de datos poblada con datos de ejemplo!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedDatabase(); 