/**
 * EL PROFE PRO - Modo Examen (Rigor y Monitor Anti-trampas en Tiempo Real)
 */

import React from 'react';
import { ShieldAlert, Play, StopCircle, EyeOff, AlertTriangle, Users, CheckCircle2, Clock, UserX } from 'lucide-react';
import { AssessmentSession, Quiz, Student, AntiCheatAlert } from '../types';

interface ExamModePanelProps {
  quizzes: Quiz[];
  activeSession: AssessmentSession | null;
  onStartExam: (quizId: string) => void;
  onStartSession: (sessionId: string) => void;
  onFinishExam: (sessionId: string) => void;
  alerts: AntiCheatAlert[];
}

export const ExamModePanel: React.FC<ExamModePanelProps> = ({
  quizzes,
  activeSession,
  onStartExam,
  onStartSession,
  onFinishExam,
  alerts
}) => {
  const [selectedQuizId, setSelectedQuizId] = React.useState<string>(quizzes[0]?.id || '');

  React.useEffect(() => {
    if (quizzes.length > 0 && !selectedQuizId) {
      setSelectedQuizId(quizzes[0].id);
    }
  }, [quizzes]);

  return (
    <div className="space-y-6">
      {/* Controles de Inicio / Fin de Examen */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Módulo de Evaluación Continua y Anti-trampas</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Modo Examen Estricto con Detección de Foco
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            Detecta en tiempo real mediante Socket.io si los estudiantes cambian de pestaña, minimizan la app o abren otras páginas durante la evaluación.
          </p>
        </div>

        {activeSession && activeSession.status === 'active' && activeSession.type === 'exam' ? (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full border border-rose-200 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Examen en Curso
            </span>
            <button
              onClick={() => onFinishExam(activeSession.id)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Finalizar Examen
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.questions.length} preg.)
                </option>
              ))}
            </select>

            <button
              onClick={() => selectedQuizId && onStartExam(selectedQuizId)}
              disabled={!selectedQuizId}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Examen
            </button>
          </div>
        )}
      </div>

      {/* Panel de Monitoreo en Tiempo Real si hay sesión activa */}
      {activeSession?.status === 'lobby' ? (
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-rose-500 uppercase tracking-widest animate-pulse">
              Sala de Espera (Examen Estricto)
            </h2>
            <p className="text-slate-400 text-lg">Únete a la sesión ingresando el PIN o escaneando el código QR</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="bg-white p-4 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img 
                src={`${window.location.protocol === 'file:' ? 'http://localhost:3000' : ''}/api/qr?pin=${activeSession.id}`} 
                alt="QR de Juego" 
                className="w-64 h-64 object-contain" 
              />
            </div>
            
            <div className="text-center md:text-left space-y-6">
              <div>
                <span className="text-slate-400 uppercase tracking-widest font-bold text-sm">PIN del Examen</span>
                <h3 className="text-5xl font-black text-indigo-400 font-mono tracking-wider">{activeSession.id.replace('session_', '')}</h3>
              </div>
              
              <div>
                <span className="text-slate-400 uppercase tracking-widest font-bold text-sm">Alumnos en Sala</span>
                <h3 className="text-5xl font-black text-emerald-400 flex items-center justify-center md:justify-start gap-3">
                  <Users className="w-10 h-10" />
                  {activeSession.students.length}
                </h3>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex justify-center">
             <button
                onClick={() => onStartSession(activeSession.id)}
                className="px-10 py-5 bg-rose-600 hover:bg-rose-500 text-white text-2xl font-black rounded-2xl shadow-xl transition-all flex items-center gap-4 animate-bounce"
             >
                <Play className="w-8 h-8 fill-white" />
                COMENZAR EXAMEN AHORA
             </button>
          </div>
        </div>
      ) : activeSession && activeSession.type === 'exam' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1 y 2: Monitor de Alumnos y Estado */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Alumnos en Examen y Estado Antitrampas
              </h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {activeSession.students.length} Registrados
              </span>
            </div>

            {activeSession.students.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Esperando que los alumnos ingresen con el código QR...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeSession.students.map((student) => {
                  const studentAnswers = activeSession.answers.filter(a => a.studentId === student.id);
                  return (
                    <div
                      key={student.id}
                      className={`p-4 rounded-xl border transition-all ${
                        student.blurCount > 0
                          ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            {student.name}
                            {student.blurCount > 0 && (
                              <span className="text-rose-600 font-extrabold text-xs" title="Incidencias detectadas">
                                🚨
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">Grupo: {student.group}</span>
                        </div>

                        {student.blurCount > 0 ? (
                          <span className="px-2.5 py-1 bg-rose-600 text-white font-extrabold text-[11px] rounded-full shadow-sm animate-bounce">
                            ⚠️ {student.blurCount} {student.blurCount === 1 ? 'Salida' : 'Salidas'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sin Salidas
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Respuestas: {studentAnswers.length}</span>
                        <span>Puntos: {student.score || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna 3: Log de Alertas Antitrampas en Vivo */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Historial de Alertas en Tiempo Real
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2.5 pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700">Sin sospechas de trampas hasta el momento</p>
                </div>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-900">
                      <span>{al.studentName} ({al.group})</span>
                      <span className="text-[10px] text-rose-600">
                        {new Date(al.timestamp).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                    <p className="text-rose-700 font-medium">
                      ⚠️ Cambio de pestaña / Foco fuera ({al.count}ª reincidencia)
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No hay un examen activo en este momento</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Selecciona un cuestionario arriba y presiona "Iniciar Examen" para abrir la sesión de evaluación estricta en la red local.
          </p>
        </div>
      )}
    </div>
  );
};
