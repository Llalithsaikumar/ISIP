import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from backend.api.schemas.chat import ChatQueryRequest, ChatQueryResponse
from backend.api.deps import get_rag_service
from backend.services.rag_service import RAGService
from backend.utils.logging import logger

router = APIRouter()

@router.post("/query", response_model=ChatQueryResponse)
def query_assistant(
    payload: ChatQueryRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    Query the AI Safety Assistant. The service retrieves relevant OSHA guidelines,
    plant documents, or standards, and generates a structured safety advisory.
    """
    try:
        response = rag_service.query_safety_assistant(payload.question)
        return response
    except Exception as e:
        logger.error(f"Failed to query safety assistant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Safety assistant error: {str(e)}"
        )

@router.post("/upload-document")
def upload_safety_document(
    file: UploadFile = File(...),
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    Upload industrial safety PDF, manuals, or standard operating procedures (SOPs).
    The file will be processed, chunked, and ingested into the FAISS vector database.
    """
    # Verify file extension
    ext = os.path.splitext(file.filename)[-1].lower()
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format: {ext}. Only PDF, TXT, and MD are supported."
        )

    # Define upload directory
    upload_dir = "./data/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    try:
        # Save file locally
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        
        # Ingest file content into FAISS
        ingest_result = rag_service.ingest_document(file_path)
        
        if not ingest_result.get("success"):
            raise Exception(ingest_result.get("message"))
            
        return {
            "filename": file.filename,
            "status": "Ingested and Indexed successfully",
            "chunks": ingest_result.get("chunks_count")
        }
    except Exception as e:
        logger.error(f"Error uploading and indexing document: {str(e)}")
        # Clean up file on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion pipeline failure: {str(e)}"
        )
