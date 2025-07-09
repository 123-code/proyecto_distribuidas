import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

app.post('/guardar-contenido', async (req, res) => {
  const { tipo, url, descripcion } = req.body;
  // Simula guardar en un sistema de archivos
  res.json({ mensaje: `Contenido ${tipo} guardado: ${url}` });
});

app.listen(5002, () => console.log('Gestor de contenido corriendo en puerto 5002')); 