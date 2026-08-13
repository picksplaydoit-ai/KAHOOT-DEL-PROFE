/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Wifi, FileText, ShieldAlert, Gamepad2, FileSpreadsheet, Monitor, Smartphone, GraduationCap, CheckCircle } from 'lucide-react';

import { NetworkPanel } from './components/NetworkPanel';
import { QuizEditor } from './components/QuizEditor';
import { ExamModePanel } from './components/ExamModePanel';
import { KahootModePanel } from './components/KahootModePanel';
import { ResultsPanel } from './components/ResultsPanel';
import { StudentPortal } from './components/StudentPortal';

import { NetworkInfo, Quiz, AssessmentSession, Student, AntiCheatAlert } from './types';

export default function App() {
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>('teacher');
  const [activeTab, setActiveTab] = useState<'network' | 'editor' | 'exam' | 'kahoot' | 'results'>('network');

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<AntiCheatAlert[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const apiBaseUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
  
  // Cargar información inicial del servidor
  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/network-info`);
      const data = await res.json();
      setNetworkInfo(data);
    } catch (err) {
      console.error('Error obteniendo info de red:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/quizzes`);
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error('Error cargando cuestionarios:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/sessions`);
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && data[0].status === 'active') {
        setActiveSession(data[0]);
        setStudents(data[0].students || []);
        setAlerts(data[0].alerts || []);
      }
    } catch (err) {
      console.error('Error cargando sesiones:', err);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
    fetchQuizzes();
    fetchSessions();

    const socketUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : undefined;
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('teacher:student-joined', (data: { student: Student; session: AssessmentSession }) => {
      setActiveSession(data.session);
      setStudents(data.session.students || []);
    });

    newSocket.on('teacher:student-alert', (data: { alert: AntiCheatAlert; session: AssessmentSession }) => {
      setActiveSession(data.session);
      setStudents(data.session.students || []);
      setAlerts(prev => [data.alert, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSaveQuiz = async (quiz: Quiz) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz)
      });
      const saved = await res.json();
      setQuizzes(prev => [saved, ...prev.filter(q => q.id !== saved.id)]);
    } catch (err) {
      console.error('Error guardando cuestionario:', err);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      await fetch(`${apiBaseUrl}/api/quizzes/${id}`, { method: 'DELETE' });
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Error eliminando cuestionario:', err);
    }
  };

  const handleStartExam = async (quizId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, type: 'exam' })
      });
      const newSession = await res.json();
      setActiveSession(newSession);
      setStudents([]);
      setAlerts([]);
      fetchSessions();
      setActiveTab('exam');
    } catch (err) {
      console.error('Error iniciando examen:', err);
    }
  };

  const handleStartKahoot = async (quizId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, type: 'kahoot', questionTimerSeconds: 30 })
      });
      const newSession = await res.json();
      setActiveSession(newSession);
      setStudents([]);
      setAlerts([]);
      fetchSessions();
      setActiveTab('kahoot');
    } catch (err) {
      console.error('Error iniciando Kahoot:', err);
    }
  };

  const handleNextQuestion = (sessionId: string, nextIndex: number) => {
    if (socket) {
      socket.emit('teacher:change-kahoot-question', { sessionId, questionIndex: nextIndex });
    }
  };

  const handleStartSession = (sessionId: string) => {
    if (socket) {
      socket.emit('teacher:start-session', { sessionId });
    }
    fetchSessions();
  };

  const handleFinishSession = (sessionId: string) => {
    if (socket) {
      socket.emit('teacher:finish-session', { sessionId });
    }
    fetchSessions();
  };

  if (viewMode === 'student') {
    return (
      <StudentPortal
        initialSessionId={activeSession?.id}
        onExitPortal={() => setViewMode('teacher')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col antialiased">
      {/* Barra Superior Principal (Docente Desktop) */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">El Profe Pro</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  v1.0 Offline
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Servidor Evaluativo Local e Interactivo</p>
            </div>
          </div>

          {/* Selector de Vista: Panel Docente vs Vista Estudiante */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Panel Docente</span>
              </button>
              <button
                onClick={() => setViewMode('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Vista Alumno</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Módulos Docente */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-slate-800 pt-2 pb-0">
          {[
            { id: 'network', label: '1. Red y QR Local', icon: Wifi },
            { id: 'editor', label: '2. Cargador Texto', icon: FileText },
            { id: 'exam', label: '3. Modo Examen', icon: ShieldAlert },
            { id: 'kahoot', label: '4. Modo Kahoot', icon: Gamepad2 },
            { id: 'results', label: '5. Reportes Excel', icon: FileSpreadsheet }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap border-t-2 ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border-indigo-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'network' && (
          <NetworkPanel
            networkInfo={networkInfo}
            students={students}
            onRefresh={fetchNetworkInfo}
          />
        )}

        {activeTab === 'editor' && (
          <QuizEditor
            onSaveQuiz={handleSaveQuiz}
            savedQuizzes={quizzes}
            onDeleteQuiz={handleDeleteQuiz}
          />
        )}

        {activeTab === 'exam' && (
          <ExamModePanel
            quizzes={quizzes}
            activeSession={activeSession}
            onStartExam={handleStartExam}
            onStartSession={handleStartSession}
            onFinishExam={handleFinishSession}
            alerts={alerts}
          />
        )}

        {activeTab === 'kahoot' && (
          <KahootModePanel
            quizzes={quizzes}
            activeSession={activeSession}
            onStartKahoot={handleStartKahoot}
            onStartSession={handleStartSession}
            onNextQuestion={handleNextQuestion}
            onFinishKahoot={handleFinishSession}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPanel
            sessions={sessions}
          />
        )}
      </main>

      {/* Pie de Página */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-medium">
        El Profe Pro © 2026 • Servidor Local Offline en Electron & Express + Socket.io
      </footer>
    </div>
  );
}
