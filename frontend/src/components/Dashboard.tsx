'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  nivel: string;
  instructor: string;
  total_contenidos: string;
  puntuacion_promedio: string;
}

interface Stats {
  totalCursos: number;
  cursosCompletados: number;
  promedioNotas: number;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Obtener cursos disponibles
      axios.get('http://localhost:3001/cursos')
        .then(response => setCursos(response.data))
        .catch(err => console.error(err));
        
      // Obtener estadísticas del usuario
      axios.get(`http://localhost:3001/dashboard-stats/${parsedUser.id}`)
        .then(response => setStats(response.data))
        .catch(err => console.error(err));
    }
  }, []);

  if (!user) return <div className="loading">Cargando...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard de Aprendizaje</h1>
        <p>Bienvenido, {user.nombre}</p>
        <span className="user-role">{user.rol === 'superuser' ? 'Administrador' : user.rol}</span>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Cursos Disponibles</h3>
            <p className="stat-number">{stats.totalCursos}</p>
          </div>
          <div className="stat-card">
            <h3>Cursos Completados</h3>
            <p className="stat-number">{stats.cursosCompletados}</p>
          </div>
          <div className="stat-card">
            <h3>Promedio de Notas</h3>
            <p className="stat-number">{stats.promedioNotas.toFixed(1)}</p>
          </div>
        </div>
      )}

      <div className="courses-section">
        <h2>Cursos Disponibles</h2>
        <div className="courses-grid">
          {cursos.map(curso => (
            <div key={curso.id} className="course-card">
              <div className="course-header">
                <h3>{curso.titulo}</h3>
                <span className="course-level">{curso.nivel}</span>
              </div>
              <p className="course-description">{curso.descripcion}</p>
              <div className="course-meta">
                <span className="course-category">{curso.categoria}</span>
                <span className="course-instructor">Por: {curso.instructor}</span>
              </div>
              <div className="course-stats">
                <span>{curso.total_contenidos} lecciones</span>
                {curso.puntuacion_promedio && (
                  <span>★ {parseFloat(curso.puntuacion_promedio).toFixed(1)}</span>
                )}
              </div>
              <button className="btn-primary">Comenzar Curso</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 