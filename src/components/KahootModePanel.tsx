/**
 * EL PROFE PRO - Modo Kahoot (Interactividad Gamificada Offline)
 */

import React, { useState, useEffect } from 'react';
import { Gamepad2, Play, Award, Flame, Users, ArrowRight, Trophy, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssessmentSession, Quiz, Question } from '../types';
import { gameAudio } from '../utils/audio';
import { KAHOOT_COLORS, KahootShape } from '../utils/kahootHelpers';

interface KahootModePanelProps {
  quizzes: Quiz[];
  activeSession: AssessmentSession | null;
  onStartKahoot: (quizId: string) => void;
  onStartSession: (sessionId: string) => void;
  onNextQuestion: (sessionId: string, nextIndex: number) => void;
  onFinishKahoot: (sessionId: string) => void;
}

export const KahootModePanel: React.FC<KahootModePanelProps> = ({
  quizzes,
  activeSession,
  onStartKahoot,
  onStartSession,
  onNextQuestion,
  onFinishKahoot
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (activeSession?.status === 'active' && !isMuted) {
      gameAudio.play();
    } else {
      gameAudio.stop();
    }
    return () => gameAudio.stop();
  }, [activeSession?.status, isMuted]);

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
      <div className="bg-[#46178f] text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-extrabold text-xs uppercase tracking-wider mb-1">
            <Gamepad2 className="w-4 h-4 animate-bounce" />
            <span>Concurso Interactivo de Velocidad y Precisión</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Modo Kahoot Profe (Pantalla Principal)
          </h2>
          <p className="text-white/80 text-xs mt-1 max-w-xl font-medium">
            Proyecta esta pantalla en clase. Los estudiantes verán en sus celulares 4 botones gigantes con formas y colores.
          </p>
        </div>

        {activeSession && activeSession.type === 'kahoot' && activeSession.status === 'active' ? (
          <div className="flex items-center gap-3">
            <button
               onClick={() => setIsMuted(!isMuted)}
               className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-lg transition-colors border border-white/20"
               title={isMuted ? "Activar Música" : "Silenciar"}
            >
               {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {!isLastQuestion ? (
              <button
                onClick={() => onNextQuestion(activeSession.id, activeSession.currentQuestionIndex + 1)}
                className="px-6 py-3 bg-white hover:bg-gray-100 text-[#46178f] font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <span>Siguiente Pregunta</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onFinishKahoot(activeSession.id)}
                className="px-6 py-3 bg-[#26890c] hover:bg-[#1d6b09] text-white font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
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
              className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id} className="bg-[#46178f]">
                  {q.title} ({q.questions.length} preg.)
                </option>
              ))}
            </select>

            <button
              onClick={() => selectedQuizId && onStartKahoot(selectedQuizId)}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-[#46178f] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-[#46178f]" />
              Iniciar Kahoot
            </button>
          </div>
        )}
      </div>

      {/* Pantalla de Juego en Vivo / Lobby */}
      {activeSession?.status === 'lobby' ? (
        <div className="bg-[#46178f] text-white rounded-3xl p-8 border-4 border-white/10 shadow-xl space-y-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Fondo estilo patrón Kahoot */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 bg-white rotate-45 transform"></div>
             <div className="absolute bottom-20 right-10 w-40 h-40 bg-white rounded-full"></div>
             <div className="absolute top-40 right-40 w-20 h-20 bg-white"></div>
          </div>
          
          <div className="text-center space-y-4 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-widest drop-shadow-lg">
              Únete a la sesión
            </h2>
            <p className="text-white/80 text-2xl font-bold">o escanea el código QR</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 relative z-10 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img 
                src={`${window.location.protocol === 'file:' ? 'http://localhost:3000' : ''}/api/qr?pin=${activeSession.id}`} 
                alt="QR de Juego" 
                className="w-64 h-64 object-contain" 
              />
            </div>
            
            <div className="text-center md:text-left space-y-6 flex-1">
              <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                <span className="text-white/80 uppercase tracking-widest font-black text-xl">PIN del juego:</span>
                <h3 className="text-7xl font-black text-white font-mono tracking-wider drop-shadow-xl mt-2">
                  {activeSession.id.replace('session_', '')}
                </h3>
              </div>
              
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                <Users className="w-8 h-8 text-white" />
                <div>
                  <span className="text-white/80 uppercase tracking-widest font-bold text-sm block">Jugadores Listos</span>
                  <span className="text-4xl font-black text-white">
                    {activeSession.students.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 relative z-10">
             <button
                onClick={() => activeSession && onStartSession(activeSession.id)}
                className="px-12 py-6 bg-white hover:bg-gray-100 text-[#46178f] text-3xl font-black rounded-2xl shadow-xl transition-all flex items-center gap-4 transform hover:scale-105"
             >
                <Play className="w-10 h-10 fill-[#46178f]" />
                Empezar
             </button>
          </div>
        </div>
      ) : activeSession && activeSession.type === 'kahoot' && currentQuestion ? (
        <div className="space-y-6">
          {/* Tarjeta de Pregunta Gigante estilo Kahoot */}
          <div className="bg-[#f2f2f2] rounded-3xl p-8 border border-gray-300 shadow-xl space-y-8 text-center relative overflow-hidden min-h-[600px] flex flex-col justify-between">
            {/* Progress Bar for time */}
            <div 
              className="absolute top-0 left-0 h-2 bg-[#46178f] transition-all ease-linear"
              style={{ width: `${(timeLeft / (currentQuestion.timeLimitSeconds || 20)) * 100}%`, transitionDuration: '1s' }}
            />
            
            {/* Header info */}
            <div className="flex items-center justify-between font-extrabold text-gray-500 bg-white p-4 rounded-2xl shadow-sm">
              <span className="text-xl">
                {activeSession.currentQuestionIndex + 1} de {currentQuiz?.questions.length}
              </span>
              
              <div className="flex items-center gap-8">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner ${timeLeft <= 5 ? 'bg-[#e21b3c] text-white animate-pulse' : 'bg-[#46178f] text-white'}`}>
                  {timeLeft}
                </div>
                <div className="text-right">
                  <span className="block text-sm uppercase">Respuestas</span>
                  <span className="text-3xl text-gray-800">{currentAnswers.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm min-h-[150px] flex items-center justify-center">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                {currentQuestion.questionText}
              </h1>
            </div>

            {/* Opciones con Botones Representativos de Colores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-auto">
              {currentQuestion.options.map((opt, idx) => {
                const styles = [
                  { bg: KAHOOT_COLORS.A, shape: 'A' },
                  { bg: KAHOOT_COLORS.B, shape: 'B' },
                  { bg: KAHOOT_COLORS.C, shape: 'C' },
                  { bg: KAHOOT_COLORS.D, shape: 'D' }
                ][idx % 4];

                const answerCountForOpt = currentAnswers.filter(a => a.selectedOption === opt.id).length;

                return (
                  <div
                    key={opt.id}
                    className="text-white p-6 rounded-md shadow-md flex items-center text-left min-h-[120px] relative overflow-hidden"
                    style={{ backgroundColor: styles.bg }}
                  >
                    <div className="w-12 h-12 mr-6 shrink-0 drop-shadow-md">
                      <KahootShape type={styles.shape} className="w-full h-full text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold drop-shadow-md">{opt.text}</h3>
                    </div>
                    {/* Revelar cantidad de respuestas si la pregunta terminó */}
                    {timeLeft === 0 && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/30 px-4 py-2 rounded-full">
                        <span className="text-2xl font-black text-white">{answerCountForOpt}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeSession?.status === 'finished' ? (
        <div className="bg-[#46178f] rounded-3xl p-12 shadow-2xl text-center space-y-8 min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
          <Trophy className="w-32 h-32 text-amber-400 mx-auto drop-shadow-2xl animate-bounce" />
          <h2 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-lg">
            Podio Final
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-4 w-full pt-8 z-10 relative">
            {leaderboard.slice(0, 3).map((student, index) => (
              <div 
                key={student.id} 
                className={`flex items-center justify-between p-6 rounded-2xl font-black text-2xl shadow-xl transform transition-transform hover:scale-105 ${
                  index === 0 ? 'bg-amber-400 text-slate-900 scale-110 z-30' : 
                  index === 1 ? 'bg-slate-300 text-slate-900 scale-105 z-20' : 
                  'bg-amber-700 text-white z-10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span>{student.name}</span>
                </div>
                <span>{student.score} pts</span>
              </div>
            ))}
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
