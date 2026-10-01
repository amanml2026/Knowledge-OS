"""
AI Router — wires all AI feature endpoints to the real Gemini provider
via the AIProvider abstraction in services/ai.py.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json

from database import get_db
import models
from services.ai import get_ai_provider, AIProvider

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ─────────────────────── shared helpers ────────────────────────────────────

def _ai() -> AIProvider:
    return get_ai_provider()


# ─────────────────────── request / response models ─────────────────────────

class ConceptChatRequest(BaseModel):
    topic: str
    mode: str = "explain"            # explain | socratic | feynman | intuition | math
    context: Optional[str] = None   # extra context / conversation history


class ConceptChatResponse(BaseModel):
    response: str
    mode: str


class PracticeRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "medium"   # easy | medium | hard
    count: Optional[int] = 3


class PracticeResponse(BaseModel):
    questions: list


class EvaluateRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: Optional[str] = None
    topic: Optional[str] = None


class EvaluateResponse(BaseModel):
    score: float           # 0.0 – 1.0
    feedback: str
    misconceptions: list
    correct_reasoning: str


class MisconceptionRequest(BaseModel):
    topic: str
    user_explanation: str


class MisconceptionResponse(BaseModel):
    misconceptions: list
    corrections: list


class LearningPathRequest(BaseModel):
    goal: str
    current_knowledge: Optional[str] = None


class LearningPathResponse(BaseModel):
    path: list


class ResearchRequest(BaseModel):
    question: str
    context: Optional[str] = None


class ResearchResponse(BaseModel):
    answer: str
    follow_up_questions: list


class DocumentAnalysisRequest(BaseModel):
    content: str
    instruction: Optional[str] = "Summarize key concepts, extract main ideas, and identify important terms."


class DocumentAnalysisResponse(BaseModel):
    summary: str
    key_concepts: list
    important_terms: list


class StatusResponse(BaseModel):
    configured: bool
    provider: str
    message: str


# ─────────────────────── status endpoint ───────────────────────────────────

@router.get("/status", response_model=StatusResponse)
def ai_status():
    """Return whether a real AI provider is configured."""
    import os
    configured = bool(os.environ.get("GEMINI_API_KEY"))
    return StatusResponse(
        configured=configured,
        provider="gemini" if configured else "mock",
        message=(
            "Gemini AI is active and ready."
            if configured
            else "Running in mock mode. Set GEMINI_API_KEY in backend/.env to enable real AI."
        ),
    )


# ─────────────────────── legacy chat (kept for backward compat) ─────────────

class LegacyChatRequest(BaseModel):
    message: str
    mode: str = "Explain"
    concept_id: Optional[int] = None


class LegacyChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=LegacyChatResponse)
def chat_with_ai(request: LegacyChatRequest, db: Session = Depends(get_db)):
    """Legacy chat endpoint — maps old mode strings to new AI calls."""
    ai = _ai()
    concept_context = ""
    if request.concept_id:
        concept = db.query(models.Concept).filter(models.Concept.id == request.concept_id).first()
        if concept:
            concept_context = f"\nContext — Concept: {concept.title}\n{concept.explanation or ''}"

    mode_map = {
        "Explain": "explain",
        "Socratic": "socratic",
        "Feynman": "feynman",
        "Intuition": "intuition",
        "Mathematical": "math",
    }
    mode = mode_map.get(request.mode, "explain")

    system_instructions = {
        "explain": "You are an expert tutor. Explain the topic clearly with examples.",
        "socratic": "You are a Socratic tutor. Guide the student with questions rather than giving direct answers.",
        "feynman": "Apply the Feynman technique: explain as if to a 12-year-old using simple analogies.",
        "intuition": "Build strong intuition for the concept using mental models, analogies, and real-world examples.",
        "math": "Provide a rigorous mathematical explanation with definitions, theorems, and proofs where applicable.",
    }

    prompt = f"Topic: {request.message}{concept_context}"
    response = ai.chat(prompt, system_instruction=system_instructions.get(mode, ""))
    return LegacyChatResponse(response=response)


# ─────────────────────── 1. concept chat (multi-mode) ──────────────────────

SYSTEM_INSTRUCTIONS = {
    "explain": (
        "You are an expert tutor. Explain the concept clearly, progressively, "
        "and with concrete examples. Use markdown formatting."
    ),
    "socratic": (
        "You are a Socratic tutor. Do NOT give the answer directly. "
        "Instead, ask probing questions that lead the student to discover the answer themselves. "
        "Use markdown."
    ),
    "feynman": (
        "Apply the Feynman Technique. Explain the concept as if teaching a curious 12-year-old. "
        "Use simple language, real-world analogies, and no jargon. Use markdown."
    ),
    "intuition": (
        "Build deep intuition for the concept. Use mental models, first-principles reasoning, "
        "and vivid analogies. Help the student feel the concept, not just know it. Use markdown."
    ),
    "math": (
        "Give a rigorous mathematical treatment: definitions, notation, key theorems, "
        "derivations, and worked examples. Use LaTeX-style math where appropriate. Use markdown."
    ),
}


@router.post("/concept-chat", response_model=ConceptChatResponse)
def concept_chat(request: ConceptChatRequest):
    ai = _ai()
    system = SYSTEM_INSTRUCTIONS.get(request.mode, SYSTEM_INSTRUCTIONS["explain"])
    prompt = f"Topic: {request.topic}"
    if request.context:
        prompt += f"\n\nConversation so far:\n{request.context}"
    response = ai.chat(prompt, system_instruction=system)
    return ConceptChatResponse(response=response, mode=request.mode)


# ─────────────────────── 2. practice generation ─────────────────────────────

@router.post("/practice", response_model=PracticeResponse)
def generate_practice(request: PracticeRequest):
    ai = _ai()
    system = (
        "You are an expert exam question designer. Generate practice questions "
        "that test deep understanding, not just recall. Return JSON."
    )
    schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "question": {"type": "string"},
                "type": {"type": "string", "enum": ["multiple_choice", "short_answer", "problem"]},
                "options": {"type": "array", "items": {"type": "string"}},
                "correct_answer": {"type": "string"},
                "explanation": {"type": "string"},
            },
            "required": ["question", "type", "correct_answer", "explanation"],
        },
    }
    prompt = (
        f"Generate {request.count} {request.difficulty}-difficulty practice questions "
        f"about: {request.topic}. Include a mix of question types."
    )
    raw = ai.chat(prompt, system_instruction=system, response_schema=schema)
    try:
        data = json.loads(raw)
        if isinstance(data, dict) and "error" in data:
            raise HTTPException(status_code=503, detail=data["error"])
        questions = data
        if not isinstance(questions, list):
            questions = questions.get("questions", [raw])
    except HTTPException:
        raise
    except Exception:
        questions = [{"question": raw, "type": "short_answer", "correct_answer": "", "explanation": ""}]
    return PracticeResponse(questions=questions)


# ─────────────────────── 3. understanding evaluation ────────────────────────

@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate_understanding(request: EvaluateRequest):
    ai = _ai()
    system = (
        "You are an expert educational evaluator. Assess the student's answer, "
        "identify misconceptions, and provide constructive feedback. Return JSON."
    )
    schema = {
        "type": "object",
        "properties": {
            "score": {"type": "number"},
            "feedback": {"type": "string"},
            "misconceptions": {"type": "array", "items": {"type": "string"}},
            "correct_reasoning": {"type": "string"},
        },
        "required": ["score", "feedback", "misconceptions", "correct_reasoning"],
    }
    prompt = (
        f"Question: {request.question}\n"
        f"Student's answer: {request.user_answer}\n"
        + (f"Correct answer: {request.correct_answer}\n" if request.correct_answer else "")
        + (f"Topic: {request.topic}\n" if request.topic else "")
        + "Evaluate the student's understanding on a 0.0–1.0 scale."
    )
    raw = ai.chat(prompt, system_instruction=system, response_schema=schema)
    try:
        data = json.loads(raw)
    except Exception:
        data = {"score": 0.5, "feedback": raw, "misconceptions": [], "correct_reasoning": ""}
    return EvaluateResponse(**data)


# ─────────────────────── 4. misconception detection ─────────────────────────

@router.post("/misconceptions", response_model=MisconceptionResponse)
def detect_misconceptions(request: MisconceptionRequest):
    ai = _ai()
    system = (
        "You are an expert educator specializing in identifying student misconceptions. "
        "Analyze the student's explanation and identify any misconceptions or gaps. Return JSON."
    )
    schema = {
        "type": "object",
        "properties": {
            "misconceptions": {"type": "array", "items": {"type": "string"}},
            "corrections": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["misconceptions", "corrections"],
    }
    prompt = (
        f"Topic: {request.topic}\n"
        f"Student's explanation: {request.user_explanation}\n"
        "Identify any misconceptions or gaps in understanding."
    )
    raw = ai.chat(prompt, system_instruction=system, response_schema=schema)
    try:
        data = json.loads(raw)
    except Exception:
        data = {"misconceptions": [raw], "corrections": []}
    return MisconceptionResponse(**data)


# ─────────────────────── 5. learning-path generation ────────────────────────

@router.post("/learning-path", response_model=LearningPathResponse)
def generate_learning_path(request: LearningPathRequest):
    ai = _ai()
    system = (
        "You are a master curriculum designer. Create an optimal, personalized learning path "
        "as a sequence of milestones. Return JSON."
    )
    schema = {
        "type": "object",
        "properties": {
            "path": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {"type": "integer"},
                        "topic": {"type": "string"},
                        "description": {"type": "string"},
                        "estimated_hours": {"type": "number"},
                        "prerequisites": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["step", "topic", "description"],
                },
            }
        },
        "required": ["path"],
    }
    prompt = (
        f"Goal: {request.goal}\n"
        + (f"Current knowledge: {request.current_knowledge}\n" if request.current_knowledge else "")
        + "Create a step-by-step learning path to achieve this goal."
    )
    raw = ai.chat(prompt, system_instruction=system, response_schema=schema)
    try:
        data = json.loads(raw)
        path = data.get("path", [])
    except Exception:
        path = [{"step": 1, "topic": raw, "description": ""}]
    return LearningPathResponse(path=path)


# ─────────────────────── 6. research assistant ──────────────────────────────

@router.post("/research", response_model=ResearchResponse)
def research_assistant(request: ResearchRequest):
    ai = _ai()
    system = (
        "You are a rigorous research assistant. Answer questions accurately, "
        "cite reasoning, and suggest follow-up research directions. Use markdown. Return JSON."
    )
    schema = {
        "type": "object",
        "properties": {
            "answer": {"type": "string"},
            "follow_up_questions": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["answer", "follow_up_questions"],
    }
    prompt = (
        f"Research question: {request.question}\n"
        + (f"Context: {request.context}\n" if request.context else "")
    )
    raw = ai.chat(prompt, system_instruction=system, response_schema=schema)
    try:
        data = json.loads(raw)
    except Exception:
        data = {"answer": raw, "follow_up_questions": []}
    return ResearchResponse(**data)


# ─────────────────────── 7. document analysis ───────────────────────────────

@router.post("/document-analysis", response_model=DocumentAnalysisResponse)
def analyze_document(request: DocumentAnalysisRequest):
    ai = _ai()
    system = (
        "You are an expert knowledge extractor. Analyze documents and extract "
        "structured insights. Return JSON."
    )
    schema = {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "key_concepts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "concept": {"type": "string"},
                        "definition": {"type": "string"},
                    },
                },
            },
            "important_terms": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["summary", "key_concepts", "important_terms"],
    }
    prompt = (
        f"Instruction: {request.instruction}\n\n"
        f"Document content:\n{request.content[:8000]}"  # guard against huge docs
    )
    raw = ai.chat(prompt, system_instruction=system, response_schema=schema)
    try:
        data = json.loads(raw)
    except Exception:
        data = {"summary": raw, "key_concepts": [], "important_terms": []}
    return DocumentAnalysisResponse(**data)
