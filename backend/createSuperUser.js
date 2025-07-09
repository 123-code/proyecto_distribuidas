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

async function createSuperUser() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Crear tabla usuarios si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla usuarios verificada/creada');

    // Agregar columna rol si no existe
    try {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'user'`);
      console.log('Columna rol agregada/verificada');
    } catch (e) {
      console.log('Columna rol ya existe o error menor:', e.message);
    }

    // Crear superusuario
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await pool.query(`
      INSERT INTO usuarios (nombre, email, contraseña, rol) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (email) DO UPDATE SET 
        nombre = EXCLUDED.nombre,
        contraseña = EXCLUDED.contraseña,
        rol = EXCLUDED.rol
      RETURNING id, nombre, email, rol
    `, ['Admin', 'admin@demo.com', hashedPassword, 'superuser']);

    console.log('Superusuario creado/actualizado:', result.rows[0]);
    console.log('Credenciales:');
    console.log('Email: admin@demo.com');
    console.log('Contraseña: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createSuperUser(); 