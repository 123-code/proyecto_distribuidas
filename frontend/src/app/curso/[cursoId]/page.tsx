'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Quiz from '../../../components/Quiz';
import './page.css';

interface Leccion {
  id: number;
  titulo: string;
  descripcion: string;
  orden: number;
}

interface ContenidoLeccion {
  id: number;
  leccion_id: number;
  tipo_aprendizaje: string;
  contenido_url?: string;
  contenido_texto?: string;
}

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  learningStyle?: string;
}

const CursoPage: React.FC = () => {
  const params = useParams();
  const cursoId = parseInt(params.cursoId as string);
  const [lecciones, setLecciones] = useState<Leccion[]>([]);
  const [currentLeccionIndex, setCurrentLeccionIndex] = useState(0);
  const [currentContenido, setCurrentContenido] = useState<ContenidoLeccion | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string>('visual'); // Default
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      const parsedUser: User = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.learningStyle) {
        setSelectedLearningStyle(parsedUser.learningStyle);
      }
      
      // Fetch lessons for the course
      axios.get(`http://localhost:3001/lecciones/${cursoId}`)
        .then(response => {
          console.log('Lecciones obtenidas:', response.data);
          setLecciones(response.data);
          if (response.data.length > 0) {
            // Load content for the first lesson
            fetchLessonContent(response.data[0].id, parsedUser.learningStyle || 'visual');
          }
        })
        .catch(err => {
          console.error('Error fetching lessons:', err);
          alert('Error al cargar las lecciones del curso. Verifica que el backend esté ejecutándose.');
        });
    }
  }, [cursoId]);

  useEffect(() => {
    if (lecciones.length > 0 && user) {
      fetchLessonContent(lecciones[currentLeccionIndex].id, selectedLearningStyle);
    }
  }, [currentLeccionIndex, selectedLearningStyle, lecciones, user]);

  const fetchLessonContent = (leccionId: number, learningStyle: string) => {
    axios.get(`http://localhost:3001/lecciones/${leccionId}/contenido/${learningStyle}`)
      .then(response => {
        console.log('Contenido de lección obtenido:', response.data);
        setCurrentContenido(response.data);
      })
      .catch(err => {
        console.error('Error fetching lesson content:', err);
        alert('Error al cargar el contenido de la lección.');
      });
  };

  const handleNextLesson = () => {
    if (currentLeccionIndex < lecciones.length - 1) {
      setShowQuiz(true); // Show quiz before moving to next lesson
    } else {
      alert('Has completado todas las lecciones de este curso!');
      // Optionally navigate back to dashboard or show course completion message
    }
  };

  const handleLearningStyleChange = (style: string) => {
    setSelectedLearningStyle(style);
  };

  const handleQuizComplete = (newLearningStyle?: string) => {
    setShowQuiz(false);
    if (newLearningStyle && user) {
      setUser({ ...user, learningStyle: newLearningStyle });
    }
    if (currentLeccionIndex < lecciones.length - 1) {
      setCurrentLeccionIndex(prevIndex => prevIndex + 1);
    } else {
      alert('Has completado todas las lecciones de este curso!');
    }
  };

  if (!user || lecciones.length === 0) return <div className="loading">Cargando curso...</div>;

  const currentLeccion = lecciones[currentLeccionIndex];

  return (
    <div className="course-page-container">
      <h1>{currentLeccion.titulo}</h1>
      <p>{currentLeccion.descripcion}</p>

      <div className="learning-style-selector">
        <button onClick={() => handleLearningStyleChange('visual')} className={selectedLearningStyle === 'visual' ? 'active' : ''}>Visual</button>
        <button onClick={() => handleLearningStyleChange('auditivo')} className={selectedLearningStyle === 'auditivo' ? 'active' : ''}>Auditivo</button>
        <button onClick={() => handleLearningStyleChange('verbal')} className={selectedLearningStyle === 'verbal' ? 'active' : ''}>Verbal</button>
        <button onClick={() => handleLearningStyleChange('quinestesico')} className={selectedLearningStyle === 'quinestesico' ? 'active' : ''}>Quinestésico</button>
      </div>

      <div className="lesson-content">
        {currentContenido ? (
          <>
            {currentContenido.contenido_url && (
              <p>URL: <a href={currentContenido.contenido_url} target="_blank" rel="noopener noreferrer">{currentContenido.contenido_url}</a></p>
            )}
            {currentContenido.contenido_texto && (
              <p>{currentContenido.contenido_texto}</p>
            )}
          </>
        ) : (
          <p>Cargando contenido de la lección...</p>
        )}
      </div>

      {!showQuiz && <button onClick={handleNextLesson}>Siguiente Lección</button>}

      {showQuiz && (
        <Quiz leccionId={currentLeccion.id} cursoId={cursoId} onQuizComplete={handleQuizComplete} />
      )}
    </div>
  );
};

export default CursoPage;
