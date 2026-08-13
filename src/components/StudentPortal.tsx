/**
 * EL PROFE PRO - Portal del Estudiante (Cliente Web Móvil)
 * --------------------------------------------------------
 * Interfaz ligera, responsiva y Mobile-First servida en el celular o laptop del alumno.
 * Incluye detector antitrampas integrado con eventos visibilitychange y blur.
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Smartphone, CheckCircle2, ShieldAlert, Award, Send, Flame, AlertTriangle } from 'lucide-react';
import { AssessmentSession, Student, Question } from '../types';

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
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">ID de Sesión Examen:</label>
              <input
                type="text"
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                placeholder="ID de sesión proporcionado por el profe"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Ingresar al Examen</span>
              <Send className="w-4 h-4" />
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

  // Banner de Alerta Antitrampas si cambia de pestaña
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

      {/* 1.5. LOBBY DE ESPERA */}
      {session?.status === 'lobby' ? (
        <div className="max-w-xl mx-auto space-y-6 text-center mt-10">
          <div className="w-20 h-20 mx-auto bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-white">¡Estás dentro!</h3>
          <p className="text-slate-400">Esperando a que el profesor inicie la actividad...</p>
          <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Tu avatar</span>
            <div className="text-6xl">{studentData?.avatar}</div>
          </div>
        </div>
      ) : session?.type === 'kahoot' ? (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-extrabold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Modo Kahoot Interactivo
            </span>
            <h3 className="text-xl font-black text-white">Selecciona tu respuesta en pantalla:</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { id: 'A', bg: 'bg-rose-600 hover:bg-rose-500', shape: '🤼‍♂️ LUCHADOR' },
              { id: 'B', bg: 'bg-blue-600 hover:bg-blue-500', shape: '🌮 TACO' },
              { id: 'C', bg: 'bg-amber-500 hover:bg-amber-400', shape: '🪅 PIÑATA' },
              { id: 'D', bg: 'bg-emerald-600 hover:bg-emerald-500', shape: '🎻 MARIACHI' }
            ].map(b => (
              <button
                key={b.id}
                onClick={() => handleSelectOption(`q_${session.currentQuestionIndex}`, b.id)}
                className={`${b.bg} h-36 rounded-3xl shadow-xl flex flex-col items-center justify-center text-white font-black text-xl transition-transform active:scale-95 border-2 border-white/20`}
              >
                <span className="text-4xl mb-2">{b.shape.split(' ')[0]}</span>
                <span>{b.shape.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          {lastFeedback && (
            <div className={`p-4 rounded-2xl text-center font-bold text-sm ${lastFeedback.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {lastFeedback.isCorrect ? `¡Correcto! +${lastFeedback.points} pts 🚀` : '¡Incorrecto! Intenta en la siguiente ❌'}
            </div>
          )}
        </div>
      ) : (
        /* 3. MODO EXAMEN NORMAL */
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

            {/* Simulación de Preguntas en Examen Continuo */}
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
      )}
    </div>
  );
};
