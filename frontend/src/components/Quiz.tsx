'use client';
import { useState } from 'react';
import axios from 'axios';
import './Quiz.css';

interface QuizProps {
  leccionId: number;
  cursoId: number;
  onQuizComplete: (newLearningStyle?: string) => void;
}

const Quiz: React.FC<QuizProps> = ({ leccionId, cursoId, onQuizComplete }) => {
  const [score, setScore] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Preguntas de ejemplo (deberían venir de la base de datos en un escenario real)
  const questions = [
    { id: 1, text: '¿Cuál es la capital de Francia?', answer: 'París' },
    { id: 2, text: '¿Cuánto es 2 + 2?', answer: '4' },
  ];

  const handleSubmitQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    let correctAnswers = 0;
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    questions.forEach(q => {
      if (formData.get(`question-${q.id}`)?.toString().toLowerCase() === q.answer.toLowerCase()) {
        correctAnswers++;
      }
    });

    const calculatedScore = (correctAnswers / questions.length) * 100;
    setScore(calculatedScore);
    setAnswered(true);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No autorizado. Por favor, inicia sesión.');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3001/lecciones/${leccionId}/quiz`,
        { score: calculatedScore, cursoId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      if (response.data.newLearningStyle) {
        // Actualizar el estilo de aprendizaje en localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.learningStyle = response.data.newLearningStyle;
        localStorage.setItem('user', JSON.stringify(userData));
        onQuizComplete(response.data.newLearningStyle);
      } else {
        onQuizComplete();
      }
    } catch (error) {
      console.error('Error al enviar el quiz:', error);
      alert('Error al enviar el quiz.');
    }
  };

  return (
    <div className="quiz-container">
      <h3>Cuestionario de la Lección</h3>
      <form onSubmit={handleSubmitQuiz}>
        {questions.map(q => (
          <div key={q.id} className="quiz-question">
            <label>{q.text}</label>
            <input type="text" name={`question-${q.id}`} required />
          </div>
        ))}
        <button type="submit" disabled={answered}>Enviar Respuestas</button>
      </form>
      {answered && score !== null && (
        <p>Tu puntuación: {score.toFixed(2)}%</p>
      )}
    </div>
  );
};

export default Quiz;
