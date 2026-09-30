from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ConceptBase(BaseModel):
    title: str
    explanation: Optional[str] = None
    difficulty: float = 0.5

class ConceptCreate(ConceptBase):
    pass

class ConceptUpdate(BaseModel):
    title: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[float] = None
    mastery_level: Optional[float] = None
    confidence: Optional[float] = None

class Concept(ConceptBase):
    id: int
    mastery_level: float
    confidence: float
    last_reviewed: Optional[datetime]
    next_review: Optional[datetime]

    class Config:
        from_attributes = True

class ConceptRelationshipBase(BaseModel):
    prerequisite_id: int
    dependent_id: int

class ConceptRelationshipCreate(ConceptRelationshipBase):
    pass

class ConceptRelationship(ConceptRelationshipBase):
    id: int
    
    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    title: str
    content: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    upload_date: datetime
    
    class Config:
        from_attributes = True
        
class DocumentChunk(BaseModel):
    id: int
    document_id: int
    content: str
    chunk_index: int
    
    class Config:
        from_attributes = True
        
class MistakeBase(BaseModel):
    concept_id: Optional[int] = None
    question: str
    user_answer: str
    correct_reasoning: str
    misconception: str
    severity: str

class MistakeCreate(MistakeBase):
    pass

class Mistake(MistakeBase):
    id: int
    date: datetime
    corrected: bool
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    mode: str = "Explain"
    concept_id: Optional[int] = None
    
class ChatResponse(BaseModel):
    response: str
