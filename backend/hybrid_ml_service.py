import os
import logging
from typing import Dict, Optional
from pathlib import Path
from dotenv import load_dotenv
from .ml_service import analyze_journal_entry as analyze_original
from .agno_ml_service import analyze_journal_entry_agno
from .error_handler import ErrorHandler, ErrorFactory, ErrorCode, ErrorSeverity, error_handler, error_factory

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridMLService:
    """
    Hybrid ML service that can use either the original implementation or Agno framework.
    Provides fallback mechanisms and allows switching between different AI approaches.
    """
    
    def __init__(self):
        """Initialize the hybrid ML service"""
        self.use_agno = os.environ.get('EUNOIA_USE_AGNO', '0') in ('1', 'true', 'True')
        self.hf_token_available = bool(os.environ.get('HF_TOKEN'))
        
        logger.info(f"Hybrid ML Service initialized:")
        logger.info(f"  - Agno enabled: {self.use_agno}")
        logger.info(f"  - HuggingFace token available: {self.hf_token_available}")
    
    def analyze_journal_entry(self, text: str) -> Dict:
        """
        Analyze journal entry using the best available method
        
        Args:
            text (str): Journal entry text to analyze
            
        Returns:
            Dict: Analysis results
        """
        context = error_handler.create_error_context(
            endpoint="hybrid_ml_analysis",
            additional_data={
                "use_agno": self.use_agno,
                "hf_token_available": self.hf_token_available,
                "text_length": len(text) if text else 0
            }
        )
        
        if not text or not text.strip():
            return self._get_empty_analysis()
        
        # Try Agno first if enabled and token is available
        if self.use_agno and self.hf_token_available:
            try:
                logger.info("Using Agno framework for analysis")
                result = analyze_journal_entry_agno(text)
                result["analysis_method"] = "agno"
                return result
            except Exception as e:
                error = error_factory.ml_service_error(
                    message="Agno analysis failed, falling back to original",
                    detail=str(e),
                    context=context,
                    original_exception=e
                )
                error_handler.log_error(error)
        
        # Fall back to original implementation
        try:
            logger.info("Using original implementation for analysis")
            result = analyze_original(text)
            result["analysis_method"] = "original"
            return result
        except Exception as e:
            error = error_factory.ml_service_error(
                message="Original analysis failed",
                detail=str(e),
                context=context,
                original_exception=e
            )
            error_handler.log_error(error)
            return self._get_fallback_analysis()
    
    def analyze_with_agno(self, text: str) -> Dict:
        """
        Force analysis using Agno framework
        
        Args:
            text (str): Journal entry text to analyze
            
        Returns:
            Dict: Analysis results from Agno
        """
        if not self.hf_token_available:
            raise ValueError("HuggingFace token not available. Set HF_TOKEN environment variable.")
        
        return analyze_journal_entry_agno(text)
    
    def analyze_with_original(self, text: str) -> Dict:
        """
        Force analysis using original implementation
        
        Args:
            text (str): Journal entry text to analyze
            
        Returns:
            Dict: Analysis results from original implementation
        """
        result = analyze_original(text)
        result["analysis_method"] = "original"
        return result
    
    def get_available_methods(self) -> Dict:
        """
        Get information about available analysis methods
        
        Returns:
            Dict: Information about available methods
        """
        return {
            "agno_available": self.hf_token_available,
            "original_available": True,
            "current_method": "agno" if (self.use_agno and self.hf_token_available) else "original",
            "agno_enabled": self.use_agno,
            "environment_variables": {
                "EUNOIA_USE_AGNO": os.environ.get('EUNOIA_USE_AGNO', '0'),
                "HF_TOKEN": "***" if self.hf_token_available else "Not set"
            }
        }
    
    def _get_empty_analysis(self) -> Dict:
        """Return empty analysis for empty text"""
        return {
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "emotion": "neutral",
            "emotion_confidence": 0.0,
            "emotions_detected": [],
            "emotion_group": "neutral",
            "stress_level": 0.0,
            "analysis_method": "empty",
            "analysis_confidence": 0.0
        }
    
    def _get_fallback_analysis(self) -> Dict:
        """Return fallback analysis when all methods fail"""
        return {
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "emotion": "neutral",
            "emotion_confidence": 0.5,
            "emotions_detected": [["neutral", 0.5]],
            "emotion_group": "neutral",
            "stress_level": 0.3,
            "analysis_method": "fallback",
            "analysis_confidence": 0.5
        }

# Global hybrid service instance
hybrid_service = HybridMLService()

def analyze_journal_entry(text: str) -> Dict:
    """
    Main function to analyze a journal entry using the hybrid service
    
    Args:
        text (str): The journal entry text
        
    Returns:
        Dict: Analysis results
    """
    return hybrid_service.analyze_journal_entry(text)
