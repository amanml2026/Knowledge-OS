from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    explanation = Column(Text, nullable=True)
    difficulty = Column(Float, default=0.5)
    mastery_level = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    last_reviewed = Column(DateTime, nullable=True)
    next_review = Column(DateTime, nullable=True)
    
    prerequisites = relationship("ConceptRelationship", foreign_keys="[ConceptRelationship.dependent_id]", back_populates="dependent")
    dependents = relationship("ConceptRelationship", foreign_keys="[ConceptRelationship.prerequisite_id]", back_populates="prerequisite")

class ConceptRelationship(Base):
    __tablename__ = "concept_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    prerequisite_id = Column(Integer, ForeignKey("concepts.id"))
    dependent_id = Column(Integer, ForeignKey("concepts.id"))
    
    prerequisite = relationship("Concept", foreign_keys=[prerequisite_id], back_populates="dependents")
    dependent = relationship("Concept", foreign_keys=[dependent_id], back_populates="prerequisites")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(Text)
    chunk_index = Column(Integer)
    
class Mistake(Base):
    __tablename__ = "mistakes"
    
    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=True)
    question = Column(Text)
    user_answer = Column(Text)
    correct_reasoning = Column(Text)
    misconception = Column(Text)
    severity = Column(String) # low, medium, high
    date = Column(DateTime, default=datetime.utcnow)
    corrected = Column(Boolean, default=False)
