'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Perfil.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const Perfil: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const fetchUsuario = async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuario(response.data);
    };
    fetchUsuario();
  }, []);

  if (!usuario) return <div>Cargando...</div>;

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h2>Perfil de Usuario</h2>
        <p><strong>Nombre:</strong> {usuario.nombre}</p>
        <p><strong>Correo Electrónico:</strong> {usuario.email}</p>
      </div>
    </div>
  );
};

export default Perfil; 