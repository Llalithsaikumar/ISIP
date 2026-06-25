import logging
import sys
from backend.utils.config import settings

def setup_logging():
    """
    Configures the root logger for the application.
    Provides standard output logging format for development and production.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # Define logging format
    log_format = (
        "[%(asctime)s] %(levelname)s in %(module)s (%(filename)s:%(lineno)d): %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    logger = logging.getLogger("isip_platform")
    logger.info(f"Logging initialized with level: {logging.getLevelName(log_level)}")
    return logger

# Singleton logger instance
logger = setup_logging()
