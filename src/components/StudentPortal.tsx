import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Smartphone, CheckCircle2, ShieldAlert, Award, Send, Flame, AlertTriangle } from 'lucide-react';
import { AssessmentSession, Student, Question } from '../types';
import { KAHOOT_COLORS, KahootShape } from '../utils/kahootHelpers';

interface StudentPortalProps {
  initialSessionId?: string;
  onExitPortal?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ initialSessionId, onExitPortal }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [isRegistered, setIsRegistered] = useState(false);
  const [studentData, setStudentData] = useState<Student | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pin = params.get('pin');
    if (pin && !sessionId) {
      setSessionId(pin);
    }
  }, []);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentScore, setCurrentScore] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [blurWarning, setBlurWarning] = useState<string | null>(null);

  // Inicializar socket.io client
  useEffect(() => {
    const socketUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : undefined;
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('student:joined-ack', (data: { student: Student; session: AssessmentSession }) => {
      setStudentData(data.student);
      setSession(data.session);
      setIsRegistered(true);
    });

    newSocket.on('student:session-started', (data: { session: AssessmentSession }) => {
      setSession(data.session);
    });

    newSocket.on('student:answer-ack', (data: { isCorrect: boolean; pointsEarned: number }) => {
      setLastFeedback({ isCorrect: data.isCorrect, points: data.pointsEarned });
      if (data.isCorrect) {
        setCurrentScore(prev => prev + data.pointsEarned);
        setStreakCount(prev => prev + 1);
      } else {
        setStreakCount(0);
      }
    });

    newSocket.on('student:question-changed', (data: { questionIndex: number; session: AssessmentSession }) => {
      setSession(data.session);
      setLastFeedback(null);
    });

    newSocket.on('session:finished', (data: { session: AssessmentSession }) => {
      setSession(data.session);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // SISTEMA ANTITRAMPAS / MONITOR DE ESTADO
  useEffect(() => {
    if (!isRegistered || !socket || !studentData || !session) return;

    const handleBlur = (eventType: 'visibility_hidden' | 'window_blur' | 'page_hide') => {
      // Emitir alerta al servidor inmediatamente por WebSocket
      socket.emit('student:visibility-change', {
        sessionId: session.id,
        studentId: studentData.id,
        eventType
      });

      setBlurWarning('⚠️ Atención: Se registró que cambiaste de pantalla. Tu profesor ha sido notificado.');
      setTimeout(() => setBlurWarning(null), 4000);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBlur('visibility_hidden');
      }
    };

    const onWindowBlur = () => {
      handleBlur('window_blur');
    };

    const onPageHide = () => {
      handleBlur('page_hide');
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [isRegistered, socket, studentData, session]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !group.trim() || !socket) return;

    const avatars = ['🤼‍♂️', '🪅', '🌮', '🎻', '🌶️', '🌵', '🥑', '🎺', '🐴', '⚽', '🏆', '🧀', '🍹'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    socket.emit('student:join', {
      name: name.trim(),
      group: group.trim(),
      sessionId: sessionId.trim(),
      avatar: randomAvatar
    });
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (!socket || !studentData || !session) return;

    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

    socket.emit('student:submit-answer', {
      sessionId: session.id,
      studentId: studentData.id,
      studentName: studentData.name,
      questionId,
      selectedOption: optionId,
      responseTimeMs: 2500
    });
  };

  // 1. Pantalla de Registro
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
              <Smartphone className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">El Profe Pro</h1>
            <p className="text-xs text-slate-400">Portal de Respuestas para Estudiantes</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nombre Completo:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Juan Pérez López"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Grupo / Matrícula:</label>
              <input
                type="text"
                value={group}
                onChange={e => setGroup(e.target.value)}
                placeholder="Ej. 2°A"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">PIN del Juego:</label>
              <input
                type="text"
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                placeholder="PIN"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-2xl tracking-widest font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-lg rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Ingresar</span>
            </button>
          </form>

          {onExitPortal && (
            <button
              onClick={onExitPortal}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-2"
            >
              ← Volver al Panel Docente
            </button>
          )}
        </div>
      </div>
    );
  }

  // Si es modo KAHOOT, queremos usar una pantalla completa especializada
  if (session?.type === 'kahoot') {
    return (
      <div className="min-h-screen bg-[#f2f2f2] font-sans flex flex-col">
        {/* Anti-cheat banner (if needed) */}
        {blurWarning && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-rose-600 text-white p-3 shadow-md text-xs font-black flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{blurWarning}</span>
          </div>
        )}

        {/* LOBBY / WAITING SCREEN */}
        {session?.status === 'lobby' ? (
          <div className="flex-1 bg-[#46178f] text-white flex flex-col items-center justify-center p-6 text-center space-y-8">
             <h1 className="text-4xl font-black mb-8">¡Estás dentro!</h1>
             <div className="text-8xl animate-bounce">{studentData?.avatar}</div>
             <p className="text-2xl font-bold">{studentData?.name}</p>
             <h2 className="text-xl font-medium mt-8">¿Ves tu nombre en la pantalla?</h2>
          </div>
        ) : session?.status === 'active' ? (
          /* ACTIVE QUESTION SCREEN */
          lastFeedback ? (
            /* FEEDBACK SCREEN (Correct/Incorrect) */
            <div className={`flex-1 flex flex-col items-center justify-center p-6 text-white text-center ${lastFeedback.isCorrect ? 'bg-[#26890c]' : 'bg-[#e21b3c]'}`}>
              <h1 className="text-5xl font-black mb-4">
                {lastFeedback.isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </h1>
              <div className="bg-black/20 px-6 py-3 rounded-full mb-8">
                <span className="text-2xl font-bold">
                  {lastFeedback.isCorrect ? `+${lastFeedback.points}` : '0'} pts
                </span>
              </div>
              <p className="text-xl font-medium">Eres un genio.</p>
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/10 p-4 flex justify-between items-center text-sm font-bold">
                <span>{studentData?.name}</span>
                <span>{currentScore} pts</span>
              </div>
            </div>
          ) : (
            /* BUTTONS SCREEN */
            <div className="flex-1 flex flex-col h-full bg-[#f2f2f2]">
              <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 p-2">
                {[
                  { id: 'A', bg: KAHOOT_COLORS.A, shape: 'A' },
                  { id: 'B', bg: KAHOOT_COLORS.B, shape: 'B' },
                  { id: 'C', bg: KAHOOT_COLORS.C, shape: 'C' },
                  { id: 'D', bg: KAHOOT_COLORS.D, shape: 'D' }
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleSelectOption(`q_${session.currentQuestionIndex}`, b.id)}
                    className="w-full h-full rounded shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    style={{ backgroundColor: b.bg }}
                  >
                    <KahootShape type={b.shape} className="w-16 h-16 text-white drop-shadow-md" />
                  </button>
                ))}
              </div>
              <div className="bg-white border-t border-gray-300 p-3 flex justify-between items-center text-gray-800 font-bold text-sm">
                <span>{studentData?.name}</span>
                <span className="bg-gray-200 px-3 py-1 rounded-md">{currentScore} pts</span>
              </div>
            </div>
          )
        ) : session?.status === 'finished' ? (
          /* FINISHED SCREEN */
          <div className="flex-1 bg-[#46178f] text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
             <Trophy className="w-24 h-24 text-amber-400 mb-4" />
             <h1 className="text-4xl font-black">¡Juego Terminado!</h1>
             <p className="text-xl">Mira el proyector para ver el podio.</p>
             <div className="mt-8 bg-black/20 p-6 rounded-2xl">
               <span className="block text-sm uppercase tracking-widest font-bold mb-2">Tu puntaje final</span>
               <span className="text-5xl font-black">{currentScore}</span>
             </div>
          </div>
        ) : null}
      </div>
    );
  }

  // MODO EXAMEN STANDARD (No Kahoot)
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-12 font-sans">
      {blurWarning && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-rose-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-rose-400 text-xs font-black flex items-center gap-3 animate-bounce">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <span>{blurWarning}</span>
        </div>
      )}

      {/* Encabezado del Estudiante */}
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
            {studentData?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">{studentData?.name}</h2>
            <span className="text-xs text-slate-400 font-medium">Grupo: {studentData?.group}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-indigo-400 block">Puntaje</span>
          <span className="text-lg font-black font-mono text-emerald-400">{currentScore} pts</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-indigo-400 uppercase">
              Examen de Evaluación Continua
            </span>
            <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-800">
              ● En Línea
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Responde las preguntas seleccionando la opción correcta. Recuerda permanecer en esta pantalla durante todo el examen.
          </p>

          <div className="space-y-4">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectOption('q_current', opt)}
                className={`w-full p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                  selectedAnswers['q_current'] === opt
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                }`}
              >
                <span>Opción {opt}</span>
                {selectedAnswers['q_current'] === opt && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};