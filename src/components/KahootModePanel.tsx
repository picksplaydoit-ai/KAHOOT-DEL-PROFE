/**
 * EL PROFE PRO - Modo Kahoot (Interactividad Gamificada Offline)
 */

import React, { useState, useEffect } from 'react';
import { Gamepad2, Play, Award, Flame, Users, ArrowRight, Trophy, RefreshCw, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssessmentSession, Quiz, Question } from '../types';

interface KahootModePanelProps {
  quizzes: Quiz[];
  activeSession: AssessmentSession | null;
  onStartKahoot: (quizId: string) => void;
  onNextQuestion: (sessionId: string, nextIndex: number) => void;
  onFinishKahoot: (sessionId: string) => void;
}

export const KahootModePanel: React.FC<KahootModePanelProps> = ({
  quizzes,
  activeSession,
  onStartKahoot,
  onNextQuestion,
  onFinishKahoot
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (activeSession) {
      const q = quizzes.find(qz => qz.id === activeSession.quizId);
      if (q) setCurrentQuiz(q);
    }
  }, [activeSession, quizzes]);

  const currentQuestion: Question | undefined = currentQuiz?.questions[activeSession?.currentQuestionIndex || 0];

  useEffect(() => {
    if (activeSession?.status === 'active' && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimitSeconds || 20);
    }
  }, [activeSession?.currentQuestionIndex, activeSession?.status, currentQuestion]);

  useEffect(() => {
    if (activeSession?.status === 'active' && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [activeSession?.status, timeLeft]);

  // Si la sesión llega a la última pregunta o finaliza, lanzar confeti
  useEffect(() => {
    if (activeSession?.status === 'finished') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [activeSession?.status]);

  const isLastQuestion = currentQuiz && activeSession
    ? activeSession.currentQuestionIndex >= currentQuiz.questions.length - 1
    : false;

  // Respuestas del reactivo actual
  const currentAnswers = activeSession?.answers.filter(
    a => currentQuestion && a.questionId === currentQuestion.id
  ) || [];

  // Calcular tabla de posiciones (Leaderboard) por puntaje acumulado
  const leaderboard = [...(activeSession?.students || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="space-y-6">
      {/* Controles Principales del Modo Kahoot */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Gamepad2 className="w-4 h-4 animate-bounce" />
            <span>Concurso Interactivo de Velocidad y Precisión</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Modo Kahoot Profe (Pantalla Principal / Proyector)
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Proyecta esta pantalla en clase. Los estudiantes verán en sus celulares 4 botones gigantes con formas geométricas y colores para responder a velocidad luz.
          </p>
        </div>

        {activeSession && activeSession.type === 'kahoot' && activeSession.status === 'active' ? (
          <div className="flex items-center gap-3">
            {!isLastQuestion ? (
              <button
                onClick={() => onNextQuestion(activeSession.id, activeSession.currentQuestionIndex + 1)}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <span>Siguiente Pregunta</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onFinishKahoot(activeSession.id)}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                <span>Ver Podio Final</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.questions.length} preg.)
                </option>
              ))}
            </select>

            <button
              onClick={() => selectedQuizId && onStartKahoot(selectedQuizId)}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Iniciar Juego Kahoot
            </button>
          </div>
        )}
      </div>

      {/* Pantalla de Juego en Vivo */}
      {activeSession && activeSession.type === 'kahoot' && currentQuestion ? (
        <div className="space-y-6">
          {/* Tarjeta de Pregunta Gigante estilo Kahoot */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg space-y-6 text-center relative overflow-hidden">
            {/* Progress Bar for time */}
            <div 
              className="absolute top-0 left-0 h-1 bg-amber-400 transition-all ease-linear"
              style={{ width: `${(timeLeft / (currentQuestion.timeLimitSeconds || 20)) * 100}%`, duration: '1s' }}
            />
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                PREGUNTA {activeSession.currentQuestionIndex + 1} DE {currentQuiz?.questions.length}
              </span>
              
              <div className="flex items-center gap-4">
                <span className={`font-mono text-xl ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                  ⏱️ {timeLeft}s
                </span>
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  {currentAnswers.length} / {activeSession.students.length} Respuestas
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
              {currentQuestion.questionText}
            </h1>

            {/* Opciones con Botones Representativos de Colores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {currentQuestion.options.map((opt, idx) => {
                const styles = [
                  { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', shape: '🤼‍♂️ Luchador (A)' },
                  { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', shape: '🌮 Taco (B)' },
                  { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', shape: '🪅 Piñata (C)' },
                  { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', shape: '🎻 Mariachi (D)' }
                ][idx % 4];

                const answerCountForOpt = currentAnswers.filter(a => a.selectedOption === opt.id).length;

                return (
                  <div
                    key={opt.id}
                    className={`${styles.bg} text-white p-5 rounded-2xl shadow-md flex items-center justify-between text-left`}
                  >
                    <div>
                      <span className="text-xs font-bold opacity-80 block uppercase tracking-wider">
                        {styles.shape}
                      </span>
                      <span className="text-xl font-extrabold">{opt.text}</span>
                    </div>

                    <div className="bg-black/30 px-3 py-1.5 rounded-xl font-mono font-black text-lg">
                      {answerCountForOpt}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla de Posiciones en Tiempo Real (Leaderboard) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Tabla de Posiciones en Vivo (Leaderboard)
              </h3>
              <span className="text-xs font-bold text-slate-500">Puntaje Dinámico por Tiempo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leaderboard.map((st, rank) => (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    rank === 0
                      ? 'bg-amber-50 border-amber-300 shadow-sm'
                      : rank === 1
                      ? 'bg-slate-100 border-slate-300'
                      : rank === 2
                      ? 'bg-amber-900/10 border-amber-800/30'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-extrabold text-xs flex items-center justify-center">
                      #{rank + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        {st.name} <span className="text-lg">{st.avatar}</span>
                      </h4>
                      <span className="text-xs text-slate-500">Grupo: {st.group}</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-indigo-700 text-base">
                    {st.score || 0} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-3xl p-12 text-center space-y-4 border border-slate-800 shadow-xl">
          <Gamepad2 className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
          <h3 className="text-2xl font-black">¿Listo para comenzar la competencia Kahoot?</h3>
          <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">
            Selecciona un cuestionario arriba y haz clic en "Iniciar Juego Kahoot". Todos los alumnos conectados verán la interfaz de juego interactivo en sus dispositivos.
          </p>
        </div>
      )}
    </div>
  );
};
