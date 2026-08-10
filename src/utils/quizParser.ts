/**
 * EL PROFE PRO - Cargador Inteligente de Cuestionarios (Parser de Texto Plano)
 * ----------------------------------------------------------------------------
 * Convierte texto plano con preguntas y opciones escritas de forma natural
 * en un objeto estructurado `Quiz` con respuestas correctas detectadas automáticamente.
 */

import { Quiz, Question, QuestionOption } from '../types';

export function parseRawQuizText(rawText: string, title: string = 'Nuevo Cuestionario'): Quiz {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions: Question[] = [];

  let currentQuestionText = '';
  let currentOptions: QuestionOption[] = [];
  let currentExplanation = '';
  let questionCounter = 1;

  const saveCurrentQuestion = () => {
    if (currentQuestionText && currentOptions.length > 0) {
      // Si ninguna opción fue marcada con *, marcar la primera como fallback o validar
      const hasCorrect = currentOptions.some(o => o.isCorrect);
      if (!hasCorrect && currentOptions.length > 0) {
        currentOptions[0].isCorrect = true; // Default fallback
      }

      questions.push({
        id: `q_${Date.now()}_${questionCounter}`,
        questionText: currentQuestionText,
        options: currentOptions,
        points: 10,
        explanation: currentExplanation || undefined
      });
      questionCounter++;
    }
    currentQuestionText = '';
    currentOptions = [];
    currentExplanation = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar si la línea es el inicio de una pregunta
    // Ejemplos: "1. ¿...", "Pregunta 1: ...", "P1: ...", "¿..."
    const isQuestionLine = 
      /^(preg|pregunta|p)\s*\d*[:.-]/i.test(line) || 
      /^\d+[\).:-]\s*/.test(line) || 
      (line.startsWith('¿') && !currentQuestionText);

    // Detectar si la línea es una opción (A), B), a., b., [A], etc.)
    const optionMatch = line.match(/^([A-Da-d1-9])[\)\.\:-]\s*(.+)$/);

    // Detectar si es una explicación
    const isExplanation = /^(exp|explicación|retroalimentación|nota)[:.-]/i.test(line);

    if (isExplanation) {
      currentExplanation = line.replace(/^(exp|explicación|retroalimentación|nota)[:.-]/i, '').trim();
    } else if (optionMatch && currentQuestionText) {
      const optionLetter = optionMatch[1].toUpperCase();
      let optionContent = optionMatch[2].trim();

      // Verificar si contiene marcas de respuesta correcta: *, [CORRECTA], (CORRECTA), [CORRECTO]
      let isCorrect = false;
      if (
        optionContent.endsWith('*') || 
        /\[CORRECTA?\]/i.test(optionContent) || 
        /\(CORRECTA?\)/i.test(optionContent)
      ) {
        isCorrect = true;
        // Limpiar las marcas del texto visible
        optionContent = optionContent
          .replace(/\*$/, '')
          .replace(/\[CORRECTA?\]/gi, '')
          .replace(/\(CORRECTA?\)/gi, '')
          .trim();
      }

      currentOptions.push({
        id: optionLetter,
        text: optionContent,
        isCorrect
      });
    } else if (isQuestionLine || !currentQuestionText) {
      // Si ya teníamos una pregunta en proceso, la guardamos antes de iniciar la nueva
      if (currentQuestionText && currentOptions.length > 0) {
        saveCurrentQuestion();
      }

      // Limpiar prefijo de número de pregunta si existe
      let cleanQuestion = line
        .replace(/^(preg|pregunta|p)\s*\d*[:.-]\s*/i, '')
        .replace(/^\d+[\).:-]\s*/, '')
        .trim();

      currentQuestionText = cleanQuestion;
    } else if (currentQuestionText && currentOptions.length === 0) {
      // Continuación del texto de la pregunta en múltiples líneas
      currentQuestionText += ' ' + line;
    }
  }

  // Guardar la última pregunta procesada
  saveCurrentQuestion();

  return {
    id: `quiz_${Date.now()}`,
    title: title.trim() || 'Cuestionario Evaluativo',
    description: `Creado con ${questions.length} preguntas procesadas`,
    questions,
    createdAt: new Date().toISOString()
  };
}

/**
 * Plantilla de ejemplo precargada para que el docente pueda probar el parser de inmediato
 */
export const SAMPLE_QUIZ_TEXT = `Pregunta 1: ¿Cuál es el símbolo químico del Oro? 🧪
A) Ag
B) Au *
C) Fe
D) Cu
Explicación: El símbolo del oro (Au) proviene del latín 'aurum' que significa 'aurora resplandeciente'.

Pregunta 2: ¿En qué año pisó el ser humano la Luna por primera vez? 🚀
A) 1965
B) 1969 [CORRECTA]
C) 1972
D) 1980
Explicación: La misión Apolo 11 alunizó el 20 de julio de 1969.

Pregunta 3: ¿Cuál es el planeta más grande de nuestro Sistema Solar? 🪐
A) Marte
B) Saturno
C) Júpiter *
D) Neptuno

Pregunta 4: ¿Qué órgano del cuerpo humano es responsable de bombear la sangre? ❤️
A) El cerebro
B) El hígado
C) El corazón *
D) Los pulmones`;
