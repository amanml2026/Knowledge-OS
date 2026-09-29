from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import logging

import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Knowledge OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "app": "Knowledge OS"}

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

@app.post("/api/ai/chat", response_model=schemas.ChatResponse)
def chat_with_ai(request: schemas.ChatRequest):
    return {"response": f"I am a mock AI. You said: '{request.message}'. Mode: {request.mode}"}
