from pydantic import BaseModel, Field
from typing import List, Optional

class ChatQueryRequest(BaseModel):
    question: str = Field(..., description="The query about safety regulations, manuals, or standard procedures.")

class ChatQueryResponse(BaseModel):
    answer: str = Field(..., description="AI safety assistant generated answer.")
    sources: List[str] = Field(..., description="Document source files used for context.")
    context_used: Optional[str] = Field(None, description="Raw document text retrieved from index (for verification).")
