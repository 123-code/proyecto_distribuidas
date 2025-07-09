'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

interface Contenido {
  id: number;
  tipo: string;
  url: string;
  descripcion: string;
}

const Dashboard: React.FC = () => {
  const [contenido, setContenido] = useState<Contenido[]>([]);

  useEffect(() => {
    const fetchContenido = async () => {
      const response = await axios.get('http://localhost:3001/contenido');
      setContenido(response.data);
    };
    fetchContenido();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Contenido Personalizado</h2>
      <div className="dashboard-grid">
        {contenido.map((item) => (
          <div key={item.id} className="dashboard-item">
            <h3>{item.tipo}</h3>
            <p>{item.descripcion}</p>
            <a href={item.url}>Ver Contenido</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 