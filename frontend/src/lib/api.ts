/**
 * api.ts — Typed API client for the Knowledge OS backend.
 * All AI calls go through here; never make fetch() calls directly in components.
 */

const BASE_URL = "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────── AI Status ─────────────────────────────────────────

export interface AIStatus {
  configured: boolean;
  provider: string;
  message: string;
}

export const getAIStatus = (): Promise<AIStatus> =>
  request<AIStatus>("/api/ai/status");

// ─────────────────────── Concept Chat ──────────────────────────────────────

export type ChatMode = "explain" | "socratic" | "feynman" | "intuition" | "math";

export interface ConceptChatRequest {
  topic: string;
  mode: ChatMode;
  context?: string;
}

export interface ConceptChatResponse {
  response: string;
  mode: string;
}

export const conceptChat = (req: ConceptChatRequest): Promise<ConceptChatResponse> =>
  request<ConceptChatResponse>("/api/ai/concept-chat", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Practice Generation ───────────────────────────────

export interface PracticeQuestion {
  question: string;
  type: "multiple_choice" | "short_answer" | "problem";
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export interface PracticeRequest {
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
}

export interface PracticeResponse {
  questions: PracticeQuestion[];
}

export const generatePractice = (req: PracticeRequest): Promise<PracticeResponse> =>
  request<PracticeResponse>("/api/ai/practice", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Understanding Evaluation ──────────────────────────

export interface EvaluateRequest {
  question: string;
  user_answer: string;
  correct_answer?: string;
  topic?: string;
}

export interface EvaluateResponse {
  score: number;
  feedback: string;
  misconceptions: string[];
  correct_reasoning: string;
}

export const evaluateAnswer = (req: EvaluateRequest): Promise<EvaluateResponse> =>
  request<EvaluateResponse>("/api/ai/evaluate", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Misconception Detection ───────────────────────────

export interface MisconceptionRequest {
  topic: string;
  user_explanation: string;
}

export interface MisconceptionResponse {
  misconceptions: string[];
  corrections: string[];
}

export const detectMisconceptions = (req: MisconceptionRequest): Promise<MisconceptionResponse> =>
  request<MisconceptionResponse>("/api/ai/misconceptions", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Learning Path Generation ──────────────────────────

export interface LearningPathStep {
  step: number;
  topic: string;
  description: string;
  estimated_hours?: number;
  prerequisites?: string[];
}

export interface LearningPathRequest {
  goal: string;
  current_knowledge?: string;
}

export interface LearningPathResponse {
  path: LearningPathStep[];
}

export const generateLearningPath = (req: LearningPathRequest): Promise<LearningPathResponse> =>
  request<LearningPathResponse>("/api/ai/learning-path", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Research Assistant ────────────────────────────────

export interface ResearchRequest {
  question: string;
  context?: string;
}

export interface ResearchResponse {
  answer: string;
  follow_up_questions: string[];
}

export const researchAssistant = (req: ResearchRequest): Promise<ResearchResponse> =>
  request<ResearchResponse>("/api/ai/research", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Document Analysis ─────────────────────────────────

export interface KeyConcept {
  concept: string;
  definition: string;
}

export interface DocumentAnalysisRequest {
  content: string;
  instruction?: string;
}

export interface DocumentAnalysisResponse {
  summary: string;
  key_concepts: KeyConcept[];
  important_terms: string[];
}

export const analyzeDocument = (req: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> =>
  request<DocumentAnalysisResponse>("/api/ai/document-analysis", {
    method: "POST",
    body: JSON.stringify(req),
  });

// ─────────────────────── Concepts CRUD ─────────────────────────────────────

export interface Concept {
  id: number;
  title: string;
  explanation?: string;
  difficulty: number;
  mastery_level: number;
  confidence: number;
}

export const getConcepts = (): Promise<Concept[]> =>
  request<Concept[]>("/api/concepts/");
