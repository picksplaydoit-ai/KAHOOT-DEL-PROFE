/**
 * EL PROFE PRO - Cargador Inteligente de Cuestionarios (Parser de Texto)
 */

import React, { useState } from 'react';
import { FileText, Sparkles, CheckCircle2, HelpCircle, Save, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Quiz } from '../types';
import { parseRawQuizText, SAMPLE_QUIZ_TEXT } from '../utils/quizParser';

interface QuizEditorProps {
  onSaveQuiz: (quiz: Quiz) => void;
  savedQuizzes: Quiz[];
  onDeleteQuiz: (id: string) => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ onSaveQuiz, savedQuizzes, onDeleteQuiz }) => {
  const [title, setTitle] = useState('Examen de Ciencias General');
  const [rawText, setRawText] = useState(SAMPLE_QUIZ_TEXT);
  const [quizType, setQuizType] = useState<'exam' | 'kahoot'>('exam');
  const [kahootTimeLimit, setKahootTimeLimit] = useState<number>(20);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(() => {
    const parsed = parseRawQuizText(SAMPLE_QUIZ_TEXT, 'Examen de Ciencias General');
    parsed.type = 'exam';
    return parsed;
  });
  const [isSaved, setIsSaved] = useState(false);

  // Re-procesar vista previa cuando cambia el texto, título o tipo
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    updatePreview(val, title, quizType, kahootTimeLimit);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    updatePreview(rawText, val, quizType, kahootTimeLimit);
  };

  const handleTypeChange = (type: 'exam' | 'kahoot') => {
    setQuizType(type);
    updatePreview(rawText, title, type, kahootTimeLimit);
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    setKahootTimeLimit(val);
    updatePreview(rawText, title, quizType, val);
  };

  const updatePreview = (text: string, t: string, type: 'exam' | 'kahoot', timeLimit: number) => {
    const parsed = parseRawQuizText(text, t);
    parsed.type = type;
    if (type === 'kahoot') {
      parsed.questions.forEach(q => q.timeLimitSeconds = timeLimit);
    }
    setPreviewQuiz(parsed);
    setIsSaved(false);
  };

  const handleInsertEmoji = (emoji: string) => {
    const newText = rawText + ` ${emoji}`;
    setRawText(newText);
    updatePreview(newText, title, quizType, kahootTimeLimit);
  };

  const handleSave = () => {
    if (!previewQuiz || previewQuiz.questions.length === 0) return;
    onSaveQuiz(previewQuiz);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_QUIZ_TEXT);
    setTitle('Cuestionario de Muestra');
    updatePreview(SAMPLE_QUIZ_TEXT, 'Cuestionario de Muestra', quizType, kahootTimeLimit);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Modo */}
      <div className="flex gap-4">
        <button
          onClick={() => handleTypeChange('exam')}
          className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm border-2 transition-all ${
            quizType === 'exam'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
              : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'
          }`}
        >
          📝 Modo Examen (Tradicional)
        </button>
        <button
          onClick={() => handleTypeChange('kahoot')}
          className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm border-2 transition-all ${
            quizType === 'kahoot'
              ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
              : 'border-slate-200 bg-white text-slate-500 hover:border-rose-300'
          }`}
        >
          🎉 Modo Kahoot (Dinámico / Mexicano)
        </button>
      </div>

      {/* Encabezado e Instrucciones */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Parser de Cuestionarios en Texto Plano</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Creador Inteligente de Exámenes y Preguntas
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            Pega tu cuestionario en formato libre. Marca la respuesta correcta con un asterisco <code className="bg-slate-100 text-indigo-700 font-bold px-1 rounded">*</code> al final de la opción o con la etiqueta <code className="bg-slate-100 text-indigo-700 font-bold px-1 rounded">[CORRECTA]</code>.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors whitespace-nowrap self-start md:self-auto"
        >
          Cargar Ejemplo Precargado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Área de Texto / Editor */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Título del Cuestionario:
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Ej. Examen Parcial de Historia 1°A"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {quizType === 'kahoot' && (
              <div className="sm:w-1/3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiempo por pregunta:
                </label>
                <select
                  value={kahootTimeLimit}
                  onChange={handleTimeLimitChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 Segundos</option>
                  <option value={20}>20 Segundos</option>
                  <option value={30}>30 Segundos</option>
                  <option value={60}>60 Segundos</option>
                </select>
              </div>
            )}
          </div>

          {/* Barra de Emojis Rápida */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 mr-1">Insertar Emojis:</span>
            {(quizType === 'kahoot'
              ? ['🤼‍♂️', '🪅', '🌮', '🎻', '🌶️', '🌵', '🥑', '🎺', '🐴', '⚽', '🏆', '🧀', '🍹']
              : ['🧪', '🚀', '🪐', '❤️', '📚', '✍️', '⚡', '🧠', '🌎', '⭐']
            ).map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="hover:scale-125 transition-transform p-1 text-base rounded hover:bg-slate-200"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Contenido del Cuestionario (Preguntas y Opciones):
            </label>
            <textarea
              value={rawText}
              onChange={handleTextChange}
              rows={16}
              className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
              placeholder={`Pregunta 1: ¿Cuál es el río más largo del mundo?\nA) Amazonas *\nB) Nilo\nC) Misisipi`}
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {previewQuiz ? `${previewQuiz.questions.length} preguntas detectadas` : '0 preguntas'}
            </span>

            <button
              onClick={handleSave}
              disabled={!previewQuiz || previewQuiz.questions.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
              }`}
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaved ? '¡Cuestionario Guardado!' : 'Guardar Cuestionario en SQLite'}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa Interactiva */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Vista Previa Interactiva del Alumno
            </h3>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              {previewQuiz?.questions.length || 0} Reactivos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[520px] space-y-4 pr-1">
            {!previewQuiz || previewQuiz.questions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No se detectaron preguntas válidas</p>
                <p className="text-xs mt-1">Sigue el formato: Pregunta: ... A) ... B) *</p>
              </div>
            ) : (
              previewQuiz.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 flex-1">
                      {q.questionText}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map(opt => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>
                          <strong className="mr-1.5">{opt.id})</strong> {opt.text}
                        </span>
                        {opt.isCorrect && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                            Correcta ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 italic">
                      💡 <strong>Retroalimentación:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cuestionarios Guardados en Base de Datos */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800">
          Cuestionarios Guardados en SQLite local ({savedQuizzes.length})
        </h3>

        {savedQuizzes.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No hay cuestionarios guardados en la base de datos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedQuizzes.map(q => (
              <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{q.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{q.questions.length} preguntas</p>
                </div>
                <button
                  onClick={() => onDeleteQuiz(q.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar cuestionario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
