from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from backend.utils.config import settings
from backend.utils.logging import logger

# Try importing Gemini chat model; fall back to a mock LLM if key is missing
try:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "placeholder_key" and len(settings.GEMINI_API_KEY) > 10:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.2,
            google_api_key=settings.GEMINI_API_KEY
        )
        logger.info("Using Gemini 2.0 Flash Chat model for RAG.")
    else:
        raise ValueError("Missing valid Gemini Key.")
except Exception:
    logger.warning("GEMINI_API_KEY not configured. Initializing Local Mock LLM fallback for safety assistant.")
    
    # Create a simple mock LLM class following LangChain interface guidelines
    class MockSafetyLLM:
        def invoke(self, prompt: Any) -> Any:
            class MockResponse:
                # Extract prompt text or format a generic reply
                content = (
                    "**[SYSTEM WARNING: RUNNING IN OFFLINE MOCK MODE]**\n\n"
                    "Thank you for asking. Based on the provided industrial safety documentation, please ensure "
                    "all workers wear Class-A PPE, verify LOTO (Lockout-Tagout) procedures, and maintain a "
                    "safe distance. For specific regulatory compliance, please check OSHA standard 1910."
                )
            return MockResponse()
    
    llm = MockSafetyLLM()

# Standard prompt for the safety intelligence assistant (with RAG context)
RAG_SYSTEM = """You are an AI-powered Industrial Safety Intelligence Assistant.
Your goal is to answer queries regarding industrial hazards, OSHA regulations, standard operating procedures (SOPs), 
incident mitigations, and safety reports.

Use the following retrieved context chunks to answer the user's safety query.
You must answer questions strictly using only the provided context. If the answer is not found in the context, you must state: "I do not have enough information in the provided context to answer this safety question." and must not extrapolate.

You must explicitly cite the source document name (e.g. `[osha_safety_guideline.pdf]`) at the end of the response text based on the sources provided in the context metadata (if available)."""

RAG_HUMAN = """Context:
{context}

Query: {question}

Provide a detailed safety advisory:"""

# Direct-answer prompt (no RAG context available — no documents uploaded yet)
DIRECT_SYSTEM = """You are an AI-powered Industrial Safety Intelligence Assistant.
Your goal is to answer queries regarding industrial hazards, OSHA regulations, standard operating procedures (SOPs), 
incident mitigations, and safety reports.

No internal safety documents have been uploaded to the knowledge base yet.
Answer the user's question using your general training knowledge about industrial safety.
Always remind the user that they can upload safety manuals, OSHA handbooks, or SOPs for more precise, context-grounded answers."""

DIRECT_HUMAN = """Query: {question}

Provide a detailed safety advisory:"""

rag_prompt = ChatPromptTemplate.from_messages([
    ("system", RAG_SYSTEM),
    ("human", RAG_HUMAN),
])

direct_prompt = ChatPromptTemplate.from_messages([
    ("system", DIRECT_SYSTEM),
    ("human", DIRECT_HUMAN),
])

class RAGSafetyChain:
    """
    Combines retrieval and LLM processing using LangChain Expression Language (LCEL).
    """
    def __init__(self, vector_store_manager):
        self.vector_store_manager = vector_store_manager

    def answer_query(self, question: str) -> Dict[str, Any]:
        """
        Runs retrieval, structures the prompt with context, and generates response.
        Falls back to direct LLM mode when no documents have been indexed.
        """
        # Check if the vector store has been initialized with documents
        has_index = self.vector_store_manager.db is not None

        if has_index:
            # RAG mode: retrieve context docs and answer grounded in them
            retrieved_docs = self.vector_store_manager.similarity_search(question, k=3)
            context_str = "\n\n".join([doc.page_content for doc in retrieved_docs])
            sources = [doc.metadata.get("source", "Unknown") for doc in retrieved_docs]

            if context_str.strip():
                formatted_prompt = rag_prompt.format_messages(context=context_str, question=question)
            else:
                # Documents exist but search returned empty — use direct mode
                formatted_prompt = direct_prompt.format_messages(question=question)
                context_str = ""
                sources = []
        else:
            # No FAISS index at all — use direct LLM mode
            formatted_prompt = direct_prompt.format_messages(question=question)
            context_str = ""
            sources = []

        # Invoke LLM
        try:
            response = llm.invoke(formatted_prompt)
            answer = response.content
        except Exception as e:
            logger.error(f"Error invoking LLM: {str(e)}")
            answer = f"Error generating answer: {str(e)}"

        return {
            "answer": answer,
            "sources": list(set(sources)),
            "context_used": context_str
        }
