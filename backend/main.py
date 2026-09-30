from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import json

import models, schemas, database
from routers import ai_router
from services.ai import get_ai_provider

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Knowledge OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI routes (Gemini-backed) ────────────────────────────────────────────────
app.include_router(ai_router.router)

# ── Core routes ──────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "ok", "app": "Knowledge OS"}

# ── Concepts ─────────────────────────────────────────────────────────────────

@app.get("/api/concepts/", response_model=List[schemas.Concept])
def read_concepts(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    concepts = db.query(models.Concept).offset(skip).limit(limit).all()
    return concepts

@app.post("/api/concepts/", response_model=schemas.Concept)
def create_concept(concept: schemas.ConceptCreate, db: Session = Depends(database.get_db)):
    db_concept = models.Concept(**concept.model_dump())
    db.add(db_concept)
    db.commit()
    db.refresh(db_concept)
    return db_concept

@app.get("/api/concepts/{concept_id}", response_model=schemas.Concept)
def read_concept(concept_id: int, db: Session = Depends(database.get_db)):
    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    if concept is None:
        raise HTTPException(status_code=404, detail="Concept not found")
    return concept

@app.patch("/api/concepts/{concept_id}", response_model=schemas.Concept)
def update_concept(concept_id: int, updates: schemas.ConceptUpdate, db: Session = Depends(database.get_db)):
    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    if concept is None:
        raise HTTPException(status_code=404, detail="Concept not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(concept, field, value)
    db.commit()
    db.refresh(concept)
    return concept

@app.delete("/api/concepts/{concept_id}")
def delete_concept(concept_id: int, db: Session = Depends(database.get_db)):
    concept = db.query(models.Concept).filter(models.Concept.id == concept_id).first()
    if concept is None:
        raise HTTPException(status_code=404, detail="Concept not found")
    db.delete(concept)
    db.commit()
    return {"ok": True}

# ── Relationships ─────────────────────────────────────────────────────────────

@app.get("/api/relationships/", response_model=List[schemas.ConceptRelationship])
def read_relationships(db: Session = Depends(database.get_db)):
    return db.query(models.ConceptRelationship).all()

@app.post("/api/relationships/", response_model=schemas.ConceptRelationship)
def create_relationship(rel: schemas.ConceptRelationshipCreate, db: Session = Depends(database.get_db)):
    db_rel = models.ConceptRelationship(**rel.model_dump())
    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)
    return db_rel

# ── Mistakes ──────────────────────────────────────────────────────────────────

@app.get("/api/mistakes/", response_model=List[schemas.Mistake])
def read_mistakes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Mistake).order_by(models.Mistake.date.desc()).offset(skip).limit(limit).all()

@app.post("/api/mistakes/", response_model=schemas.Mistake)
def create_mistake(mistake: schemas.MistakeCreate, db: Session = Depends(database.get_db)):
    db_mistake = models.Mistake(**mistake.model_dump())
    db.add(db_mistake)
    db.commit()
    db.refresh(db_mistake)
    return db_mistake

@app.patch("/api/mistakes/{mistake_id}/correct")
def mark_mistake_corrected(mistake_id: int, db: Session = Depends(database.get_db)):
    mistake = db.query(models.Mistake).filter(models.Mistake.id == mistake_id).first()
    if mistake is None:
        raise HTTPException(status_code=404, detail="Mistake not found")
    mistake.corrected = True
    db.commit()
    return {"ok": True}

@app.delete("/api/mistakes/{mistake_id}")
def delete_mistake(mistake_id: int, db: Session = Depends(database.get_db)):
    mistake = db.query(models.Mistake).filter(models.Mistake.id == mistake_id).first()
    if mistake is None:
        raise HTTPException(status_code=404, detail="Mistake not found")
    db.delete(mistake)
    db.commit()
    return {"ok": True}

# ── Documents ─────────────────────────────────────────────────────────────────

@app.get("/api/documents/", response_model=List[schemas.Document])
def read_documents(db: Session = Depends(database.get_db)):
    return db.query(models.Document).order_by(models.Document.upload_date.desc()).all()

@app.post("/api/documents/", response_model=schemas.Document)
def create_document(doc: schemas.DocumentCreate, db: Session = Depends(database.get_db)):
    db_doc = models.Document(**doc.model_dump())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(database.get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"ok": True}

# ── Progress Stats ─────────────────────────────────────────────────────────────

@app.get("/api/stats/")
def get_stats(db: Session = Depends(database.get_db)):
    """Aggregate stats for the Progress page."""
    concepts = db.query(models.Concept).all()
    mistakes = db.query(models.Mistake).all()
    total = len(concepts)
    mastered = sum(1 for c in concepts if c.mastery_level >= 0.8)
    learning = sum(1 for c in concepts if 0.3 <= c.mastery_level < 0.8)
    weak = sum(1 for c in concepts if c.mastery_level < 0.3)
    avg_mastery = (sum(c.mastery_level for c in concepts) / total) if total else 0
    open_mistakes = sum(1 for m in mistakes if not m.corrected)
    corrected_mistakes = sum(1 for m in mistakes if m.corrected)
    # Mastery distribution by concept
    concept_mastery = [
        {"title": c.title, "mastery": round(c.mastery_level * 100), "difficulty": round(c.difficulty * 100)}
        for c in concepts
    ]
    return {
        "total_concepts": total,
        "mastered": mastered,
        "learning": learning,
        "weak": weak,
        "avg_mastery": round(avg_mastery * 100),
        "open_mistakes": open_mistakes,
        "corrected_mistakes": corrected_mistakes,
        "concept_mastery": concept_mastery,
    }

# ── Semantic Search ────────────────────────────────────────────────────────────

@app.get("/api/search/")
def semantic_search(q: str, db: Session = Depends(database.get_db)):
    """
    Simple full-text search across concepts, documents, and mistakes.
    Returns ranked results. Upgraded to AI-ranked when GEMINI_API_KEY is set.
    """
    if not q or not q.strip():
        return {"results": []}

    query_lower = q.lower()
    results = []

    # Search concepts
    concepts = db.query(models.Concept).all()
    for c in concepts:
        score = 0
        text = f"{c.title} {c.explanation or ''}".lower()
        if query_lower in text:
            score = 2 if query_lower in c.title.lower() else 1
        if score:
            results.append({
                "type": "concept",
                "id": c.id,
                "title": c.title,
                "snippet": (c.explanation or "")[:200],
                "mastery": c.mastery_level,
                "score": score,
            })

    # Search documents
    docs = db.query(models.Document).all()
    for d in docs:
        text = f"{d.title} {d.content}".lower()
        if query_lower in text:
            idx = text.find(query_lower)
            snippet = d.content[max(0, idx - 60):idx + 140]
            results.append({
                "type": "document",
                "id": d.id,
                "title": d.title,
                "snippet": snippet,
                "score": 2 if query_lower in d.title.lower() else 1,
            })

    # Search mistakes
    mistakes = db.query(models.Mistake).all()
    for m in mistakes:
        text = f"{m.question} {m.misconception} {m.correct_reasoning}".lower()
        if query_lower in text:
            results.append({
                "type": "mistake",
                "id": m.id,
                "title": m.question[:80],
                "snippet": m.misconception[:200],
                "corrected": m.corrected,
                "score": 1,
            })

    # Sort by score desc
    results.sort(key=lambda r: r["score"], reverse=True)
    return {"results": results[:30]}
