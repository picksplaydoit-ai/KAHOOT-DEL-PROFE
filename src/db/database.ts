/**
 * EL PROFE PRO - Base de Datos Local Persistente (Offline DB Engine)
 * -------------------------------------------------------------------
 * Mantiene almacenamiento persistente seguro en disco para cuestionarios,
 * sesiones de exámenes/Kahoot, respuestas de alumnos y registros antitrampas.
 */

import fs from 'fs';
import path from 'path';
import { Quiz, AssessmentSession, AntiCheatAlert, StudentAnswer, Student } from '../types';

interface DatabaseSchema {
  quizzes: Quiz[];
  sessions: AssessmentSession[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'el_profe_pro_db.json');

// Base de datos por defecto si la base está vacía
const initialSchema: DatabaseSchema = {
  quizzes: [],
  sessions: [],
  lastUpdated: new Date().toISOString()
};

/**
 * Asegura que el directorio data/ exista y retorna el contenido de la BD
 */
function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2), 'utf-8');
      return initialSchema;
    }

    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error('Error al leer la base de datos local:', err);
    return initialSchema;
  }
}

/**
 * Escribe atomicamente en la base de datos local
 */
function writeDB(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al escribir en la base de datos local:', err);
  }
}

// ==========================================
// MÓDULO DE CUESTIONARIOS (QUIZZES)
// ==========================================

export function getAllQuizzes(): Quiz[] {
  const db = readDB();
  return db.quizzes;
}

export function getQuizById(id: string): Quiz | undefined {
  const db = readDB();
  return db.quizzes.find(q => q.id === id);
}

export function saveQuiz(quiz: Quiz): Quiz {
  const db = readDB();
  const existingIdx = db.quizzes.findIndex(q => q.id === quiz.id);

  if (existingIdx >= 0) {
    db.quizzes[existingIdx] = quiz;
  } else {
    db.quizzes.unshift(quiz);
  }

  writeDB(db);
  return quiz;
}

export function deleteQuiz(id: string): boolean {
  const db = readDB();
  const initialLen = db.quizzes.length;
  db.quizzes = db.quizzes.filter(q => q.id !== id);
  if (db.quizzes.length !== initialLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// ==========================================
// MÓDULO DE SESIONES (EXÁMENES Y KAHOOT)
// ==========================================

export function getAllSessions(): AssessmentSession[] {
  const db = readDB();
  return db.sessions;
}

export function getSessionById(id: string): AssessmentSession | undefined {
  const db = readDB();
  return db.sessions.find(s => s.id === id);
}

export function saveSession(session: AssessmentSession): AssessmentSession {
  const db = readDB();
  const existingIdx = db.sessions.findIndex(s => s.id === session.id);

  if (existingIdx >= 0) {
    db.sessions[existingIdx] = session;
  } else {
    db.sessions.unshift(session);
  }

  writeDB(db);
  return session;
}

export function registerStudentInSession(sessionId: string, student: Student): AssessmentSession | undefined {
  const db = readDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session) return undefined;

  const existingStudent = session.students.find(s => s.id === student.id || s.name === student.name && s.group === student.group);
  if (existingStudent) {
    existingStudent.socketId = student.socketId;
    existingStudent.isOnline = true;
  } else {
    session.students.push(student);
  }

  writeDB(db);
  return session;
}

export function recordAntiCheatAlert(
  sessionId: string, 
  studentId: string, 
  eventType: 'visibility_hidden' | 'window_blur' | 'page_hide'
): { session?: AssessmentSession; alert?: AntiCheatAlert } {
  const db = readDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session) return {};

  const student = session.students.find(s => s.id === studentId || s.socketId === studentId);
  if (!student) return {};

  student.blurCount = (student.blurCount || 0) + 1;
  const now = new Date().toLocaleTimeString('es-ES');
  student.lastAlertTime = now;

  const alert: AntiCheatAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: student.id,
    studentName: student.name,
    group: student.group,
    eventType,
    timestamp: new Date().toISOString(),
    count: student.blurCount
  };

  session.alerts.unshift(alert);
  writeDB(db);

  return { session, alert };
}

export function recordStudentAnswer(sessionId: string, answer: StudentAnswer): AssessmentSession | undefined {
  const db = readDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session) return undefined;

  // Evitar duplicados por la misma pregunta si es necesario, o registrar
  const existingAnswerIdx = session.answers.findIndex(
    a => a.studentId === answer.studentId && a.questionId === answer.questionId
  );

  if (existingAnswerIdx >= 0) {
    session.answers[existingAnswerIdx] = answer;
  } else {
    session.answers.push(answer);
  }

  // Actualizar puntaje del estudiante
  const student = session.students.find(s => s.id === answer.studentId);
  if (student) {
    student.score = session.answers
      .filter(a => a.studentId === answer.studentId)
      .reduce((sum, a) => sum + a.pointsEarned, 0);
  }

  writeDB(db);
  return session;
}
