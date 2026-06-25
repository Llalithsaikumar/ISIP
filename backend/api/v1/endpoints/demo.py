from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.models.database import get_db
from backend.api.schemas.demo import DemoScenarioRequest, DemoScenarioInfo, DemoRunResponse
from backend.services.demo_mode import DemoModeService
from backend.utils.logging import logger

router = APIRouter()

@router.get(
    "/scenarios",
    response_model=List[DemoScenarioInfo],
    summary="Get all available demo scenarios",
    description="Returns metadata about available scenarios including target zones and expected alerts."
)
def get_scenarios():
    try:
        return DemoModeService.get_available_scenarios()
    except Exception as e:
        logger.error(f"Failed to fetch demo scenarios: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch scenarios: {str(e)}"
        )

@router.post(
    "/run",
    response_model=DemoRunResponse,
    summary="Run safety scenario demo",
    description="Loads preset telemetry parameters, calculates risk, triggers alarms, generates incident reports, and commits an incident log to the database."
)
def run_scenario(payload: DemoScenarioRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"FastAPI demo/run requested for scenario: {payload.scenario}")
        result = DemoModeService.run_scenario(payload.scenario, db)
        return result
    except ValueError as ve:
        logger.warning(f"Validation failure in demo scenario run: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Demo scenario execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Demo execution failed: {str(e)}"
        )
