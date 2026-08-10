/**
 * EL PROFE PRO - Panel de Resultados y Módulo de Exportación Excel / CSV
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Award, AlertOctagon, CheckCircle, Clock, Users, ShieldAlert } from 'lucide-react';
import { AssessmentSession } from '../types';

interface ResultsPanelProps {
  sessions: AssessmentSession[];
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ sessions }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');

  const activeReport = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const handleDownloadExcel = (sessionId: string) => {
    window.open(`/api/sessions/${sessionId}/export/excel`, '_blank');
  };

  const handleDownloadCSV = (sessionId: string) => {
    window.open(`/api/sessions/${sessionId}/export/csv`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo de Exportación */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reportes e Historial Completo de Evaluaciones</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Exportación de Calificaciones en Excel (.xlsx) y CSV
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            Descarga con un clic los reportes detallados con tiempo por pregunta, aciertos, puntaje y número de incidencias antitrampas detectadas.
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => activeReport && handleDownloadExcel(activeReport.id)}
              disabled={!activeReport}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => activeReport && handleDownloadCSV(activeReport.id)}
              disabled={!activeReport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Descargar CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Selector de Sesión de Examen/Kahoot */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">Aún no hay exámenes o partidas registradas</p>
          <p className="text-xs mt-1">Aplica una evaluación en Modo Examen o Kahoot para ver y exportar resultados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase">Seleccionar Sesión / Examen:</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.type === 'exam' ? 'EXAMEN' : 'KAHOOT'}] {s.quizTitle} ({new Date(s.createdAt).toLocaleString('es-ES')})
                </option>
              ))}
            </select>
          </div>

          {activeReport && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{activeReport.quizTitle}</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeReport.students.length} Alumnos Participantes • Tipo: {activeReport.type.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadExcel(activeReport.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar .xlsx
                  </button>
                  <button
                    onClick={() => handleDownloadCSV(activeReport.id)}
                    className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar .csv
                  </button>
                </div>
              </div>

              {/* Tabla de Resultados */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Alumno</th>
                      <th className="p-4">Grupo</th>
                      <th className="p-4">Puntos</th>
                      <th className="p-4">Aciertos</th>
                      <th className="p-4">Salidas de Pestaña (Antitrampas)</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {activeReport.students.map((std) => {
                      const studentAnswers = activeReport.answers.filter(a => a.studentId === std.id);
                      const correctCount = studentAnswers.filter(a => a.isCorrect).length;

                      return (
                        <tr key={std.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-900">{std.name}</td>
                          <td className="p-4 text-slate-600">{std.group}</td>
                          <td className="p-4 font-mono font-bold text-indigo-700">{std.score || 0} pts</td>
                          <td className="p-4 text-emerald-700 font-bold">{correctCount} aciertos</td>
                          <td className="p-4">
                            {std.blurCount > 0 ? (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-[11px] rounded-full border border-rose-300">
                                ⚠️ {std.blurCount} incidencias
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-full">
                                ✓ Sin alertas
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-md text-[11px] font-bold">
                              Completado
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
