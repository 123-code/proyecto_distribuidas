import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

app.post('/metodologia', async (req, res) => {
  const { tema } = req.body;
  const response = await axios.post('http://ai_module:5000/generar-contenido', { tema });
  res.json({ metodologia: `Método para ${tema}: ${response.data.contenido}` });
});

app.listen(5001, () => console.log('Metodologías corriendo en puerto 5001')); 