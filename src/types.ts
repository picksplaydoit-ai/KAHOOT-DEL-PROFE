/**
 * EL PROFE PRO - Tipos Globales y Modelos de Datos
 */

export interface QuestionOption {
  id: string; // "A", "B", "C", "D"
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  options: QuestionOption[];
  points: number;
  timeLimitSeconds?: number;
  explanation?: string;
  category?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  type?: 'exam' | 'kahoot';
  subject?: string;
  questions: Question[];
  createdAt: string;
}

export interface Student {
  socketId: string;
  id: string;
  name: string;
  group: string;
  connectedAt: string;
  isOnline: boolean;
  blurCount: number; // Número de veces que salió de la pestaña/pantalla
  lastAlertTime?: string;
  score: number;
  completedAt?: string;
  avatar?: string;
}

export interface StudentAnswer {
  studentId: string;
  studentName: string;
  questionId: string;
  selectedOption: string; // "A", "B", etc.
  isCorrect: boolean;
  pointsEarned: number;
  responseTimeMs: number;
  timestamp: string;
}

export interface AntiCheatAlert {
  id: string;
  studentId: string;
  studentName: string;
  group: string;
  eventType: 'visibility_hidden' | 'window_blur' | 'page_hide';
  timestamp: string;
  count: number;
}

export type SessionType = 'exam' | 'kahoot';

export interface AssessmentSession {
  id: string;
  quizId: string;
  quizTitle: string;
  type: SessionType;
  status: 'lobby' | 'active' | 'paused' | 'finished';
  createdAt: string;
  finishedAt?: string;
  currentQuestionIndex: number;
  questionTimerSeconds: number;
  timeRemaining: number;
  students: Student[];
  answers: StudentAnswer[];
  alerts: AntiCheatAlert[];
}

export interface NetworkInfo {
  interface: string;
  address: string;
  port: number;
  qrDataUrl: string;
  fullUrl: string;
}
