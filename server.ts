/**
 * EL PROFE PRO - Servidor Principal (Express + Socket.io)
 * --------------------------------------------------------
 * Servidor HTTP y WebSockets 100% offline para la evaluación en red local.
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import * as XLSX from 'xlsx';

import { getNetworkConfig } from './src/utils/network.js';
import { parseRawQuizText, SAMPLE_QUIZ_TEXT } from './src/utils/quizParser.js';
import {
  getAllQuizzes,
  getQuizById,
  saveQuiz,
  deleteQuiz,
  getAllSessions,
  getSessionById,
  saveSession,
  registerStudentInSession,
  recordAntiCheatAlert,
  recordStudentAnswer
} from './src/db/database.js';
import { AssessmentSession, Student, StudentAnswer, Quiz } from './src/types.js';

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// Iniciar con un cuestionario de ejemplo si la BD está vacía
const initialQuizzes = getAllQuizzes();
if (initialQuizzes.length === 0) {
  const sampleQuiz = parseRawQuizText(SAMPLE_QUIZ_TEXT, 'Cuestionario General de Prueba');
  saveQuiz(sampleQuiz);
}

// ==========================================
// ENDPOINTS DE LA API REST (DOCENTE Y CLIENTE)
// ==========================================

// Información de red y código QR
app.get('/api/network-info', async (req, res) => {
  try {
    const config = await getNetworkConfig(PORT);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Error al detectar la red' });
  }
});

// Endpoint dinámico para generar QR bajo demanda
app.get('/api/qr', async (req, res) => {
  try {
    const pin = req.query.pin as string;
    if (!pin) return res.status(400).send('Falta pin');
    
    // Obtener la IP local real para que los alumnos puedan conectarse
    const config = await getNetworkConfig(PORT);
    const url = `${config.fullUrl}/?pin=${pin}`;

    const QRCode = (await import('qrcode')).default;
    const buffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: { dark: '#1e1b4b', light: '#ffffff' }
    });
    
    res.type('png');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error generando QR' });
  }
});

// Cuestionarios
app.get('/api/quizzes', (req, res) => {
  res.json(getAllQuizzes());
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = getQuizById(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Cuestionario no encontrado' });
  res.json(quiz);
});

app.post('/api/quizzes/parse', (req, res) => {
  const { rawText, title } = req.body;
  if (!rawText) return res.status(400).json({ error: 'El texto es obligatorio' });
  const parsed = parseRawQuizText(rawText, title);
  res.json(parsed);
});

app.post('/api/quizzes', (req, res) => {
  const quiz: Quiz = req.body;
  if (!quiz || !quiz.title || !quiz.questions) {
    return res.status(400).json({ error: 'Estructura de cuestionario inválida' });
  }
  const saved = saveQuiz(quiz);
  res.json(saved);
});

app.delete('/api/quizzes/:id', (req, res) => {
  const success = deleteQuiz(req.params.id);
  res.json({ success });
});

// Sesiones de Evaluación
app.get('/api/sessions', (req, res) => {
  res.json(getAllSessions());
});

app.get('/api/sessions/:id', (req, res) => {
  const session = getSessionById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(session);
});

app.post('/api/sessions/start', (req, res) => {
  const { quizId, type, questionTimerSeconds = 30 } = req.body;
  const quiz = getQuizById(quizId);
  if (!quiz) return res.status(404).json({ error: 'Cuestionario no encontrado' });

  const newSession: AssessmentSession = {
    id: `session_${Date.now()}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    type: type || 'exam',
    status: 'lobby', // Sala de espera inicial para Kahoot y Examen
    createdAt: new Date().toISOString(),
    currentQuestionIndex: 0,
    questionTimerSeconds: Number(questionTimerSeconds),
    timeRemaining: Number(questionTimerSeconds),
    students: [],
    answers: [],
    alerts: []
  };

  saveSession(newSession);
  io.emit('session:started', newSession);
  res.json(newSession);
});

// EXPORTACIÓN DE RESULTADOS (EXCEL .xlsx Y CSV)
app.get('/api/sessions/:id/export/excel', (req, res) => {
  const session = getSessionById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  const quiz = getQuizById(session.quizId);
  const totalQuestions = quiz ? quiz.questions.length : 0;

  // Preparar Filas para el Excel
  const rows = session.students.map(s => {
    const studentAnswers = session.answers.filter(a => a.studentId === s.id);
    const correctAnswers = studentAnswers.filter(a => a.isCorrect).length;
    const totalTimeMs = studentAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0);
    const avgTimeSec = studentAnswers.length > 0 ? (totalTimeMs / studentAnswers.length / 1000).toFixed(1) : 0;

    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return {
      'Nombre del Alumno': s.name,
      'Grupo / Matrícula': s.group,
      'Calificación (%)': `${percentage}%`,
      'Puntos Acumulados': s.score || 0,
      'Aciertos': correctAnswers,
      'Errores': studentAnswers.length - correctAnswers,
      'Total Preguntas': totalQuestions,
      'Tiempo Prom. Respuesta (seg)': avgTimeSec,
      'Alertas de Salida de Pantalla': s.blurCount || 0,
      'Estado Antitrampas': (s.blurCount || 0) > 0 ? `Sospechoso (${s.blurCount} salidas)` : 'Limpio'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="ElProfePro_Resultados_${session.id}.xlsx"`);
  res.send(buffer);
});

app.get('/api/sessions/:id/export/csv', (req, res) => {
  const session = getSessionById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  const quiz = getQuizById(session.quizId);
  const totalQuestions = quiz ? quiz.questions.length : 0;

  const rows = session.students.map(s => {
    const studentAnswers = session.answers.filter(a => a.studentId === s.id);
    const correctAnswers = studentAnswers.filter(a => a.isCorrect).length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return {
      'Nombre': s.name,
      'Grupo': s.group,
      'Calificacion': `${percentage}%`,
      'Puntos': s.score || 0,
      'Aciertos': correctAnswers,
      'TotalPreguntas': totalQuestions,
      'AlertasSalidaPantalla': s.blurCount || 0
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ElProfePro_Resultados_${session.id}.csv"`);
  res.send(csvOutput);
});


// ==========================================
// WEBSOCKETS EN TIEMPO REAL (SOCKET.IO)
// ==========================================

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Registro de estudiante en sesión activa
  socket.on('student:join', (data: { name: string; group: string; sessionId: string; avatar?: string }) => {
    const { name, group, sessionId, avatar } = data;
    const session = getSessionById(sessionId);

    if (!session) {
      socket.emit('student:error', { message: 'Sesión no válida o no encontrada' });
      return;
    }

    const student: Student = {
      socketId: socket.id,
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      group,
      connectedAt: new Date().toISOString(),
      isOnline: true,
      blurCount: 0,
      score: 0,
      avatar
    };

    const updatedSession = registerStudentInSession(sessionId, student);
    socket.join(sessionId);

    // Confirmación al estudiante
    socket.emit('student:joined-ack', { student, session: updatedSession });

    // Notificar al docente
    io.to(sessionId).emit('teacher:student-joined', { student, session: updatedSession });
    console.log(`👤 Estudiante unido: ${name} (${group}) en sesión ${sessionId}`);
  });

  // Evento Antitrampas (Salida de pestaña / blur / visibilitychange)
  socket.on('student:visibility-change', (data: { sessionId: string; studentId: string; eventType: 'visibility_hidden' | 'window_blur' | 'page_hide' }) => {
    const { sessionId, studentId, eventType } = data;
    const { session, alert } = recordAntiCheatAlert(sessionId, studentId, eventType);

    if (session && alert) {
      // Emitir alerta inmediata al docente
      io.to(sessionId).emit('teacher:student-alert', { alert, session });
      console.warn(`🚨 ALERTA ANTITRAMPAS: ${alert.studentName} salió de la pantalla (${alert.count} veces)`);
    }
  });

  // Envío de respuesta de examen o Kahoot
  socket.on('student:submit-answer', (data: {
    sessionId: string;
    studentId: string;
    studentName: string;
    questionId: string;
    selectedOption: string;
    responseTimeMs: number;
  }) => {
    const { sessionId, studentId, studentName, questionId, selectedOption, responseTimeMs } = data;
    const session = getSessionById(sessionId);

    if (!session) return;

    const quiz = getQuizById(session.quizId);
    if (!quiz) return;

    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const correctOpt = question.options.find(o => o.isCorrect);
    const isCorrect = correctOpt ? correctOpt.id === selectedOption : false;

    // Cálculo de puntos para Kahoot (velocidad + precisión)
    let pointsEarned = 0;
    if (isCorrect) {
      if (session.type === 'kahoot') {
        const maxTime = (question.timeLimitSeconds || session.questionTimerSeconds || 20) * 1000;
        const timeFactor = Math.max(0, 1 - responseTimeMs / maxTime);
        pointsEarned = Math.round(500 + 500 * timeFactor); // Máx 1000 pts
      } else {
        pointsEarned = question.points || 10;
      }
    }

    const studentAnswer: StudentAnswer = {
      studentId,
      studentName,
      questionId,
      selectedOption,
      isCorrect,
      pointsEarned,
      responseTimeMs,
      timestamp: new Date().toISOString()
    };

    const updatedSession = recordStudentAnswer(sessionId, studentAnswer);

    socket.emit('student:answer-ack', { isCorrect, pointsEarned });
    io.to(sessionId).emit('teacher:answer-received', { answer: studentAnswer, session: updatedSession });
  });

  // Controles del Docente
  socket.on('teacher:start-session', (data: { sessionId: string }) => {
    const { sessionId } = data;
    const session = getSessionById(sessionId);
    if (!session) return;
    
    session.status = 'active';
    session.timeRemaining = session.questionTimerSeconds;
    saveSession(session);
    
    io.to(sessionId).emit('student:session-started', { session });
    io.to(sessionId).emit('teacher:session-started', { session });
  });

  socket.on('teacher:change-kahoot-question', (data: { sessionId: string; questionIndex: number }) => {
    const { sessionId, questionIndex } = data;
    const session = getSessionById(sessionId);
    if (!session) return;

    session.currentQuestionIndex = questionIndex;
    session.timeRemaining = session.questionTimerSeconds;
    saveSession(session);

    io.to(sessionId).emit('student:question-changed', {
      questionIndex,
      session
    });
  });

  socket.on('teacher:finish-session', (data: { sessionId: string }) => {
    const { sessionId } = data;
    const session = getSessionById(sessionId);
    if (!session) return;

    session.status = 'finished';
    session.finishedAt = new Date().toISOString();
    saveSession(session);

    io.to(sessionId).emit('session:finished', { session });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ==========================================
// CLIENTE WEB Y VITE MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // __dirname is not available in ESM, we need to construct it
    const path = await import('path');
    const fs = await import('fs');
    
    let currentDir = '';
    if (typeof __dirname !== 'undefined') {
      currentDir = __dirname;
    } else {
      // @ts-ignore
      const { fileURLToPath } = await import('url');
      // @ts-ignore
      currentDir = path.dirname(fileURLToPath(import.meta.url));
    }
    
    // Determine where index.html is located
    const distPathCandidate = path.join(currentDir, 'dist');
    const rootPathCandidate = currentDir;
    
    let servePath = currentDir;
    if (fs.existsSync(path.join(distPathCandidate, 'index.html'))) {
      servePath = distPathCandidate;
    } else if (fs.existsSync(path.join(rootPathCandidate, 'index.html'))) {
      servePath = rootPathCandidate;
    } else {
      console.warn('⚠️ No se encontró index.html ni en currentDir ni en currentDir/dist');
    }

    app.use(express.static(servePath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(servePath, 'index.html'));
    });
  }

  const tryListen = (portToTry: number) => {
    server.listen(portToTry, '0.0.0.0', () => {
      console.log(`🚀 Servidor El Profe Pro iniciado en http://localhost:${portToTry}`);
      // Actualizar variable env para que Electron la pueda leer si lo necesita
      process.env.EXPRESS_PORT = portToTry.toString();
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Puerto ${portToTry} en uso, intentando con ${portToTry + 1}...`);
        tryListen(portToTry + 1);
      } else {
        console.error('Error al iniciar el servidor:', err);
      }
    });
  };

  tryListen(PORT);
}

startServer();
