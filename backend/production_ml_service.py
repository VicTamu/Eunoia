"""
Production ML Service using external AI APIs
This service uses HuggingFace Inference API for sentiment analysis and emotion detection
instead of local models, making it suitable for production deployment on Render.
"""

import os
import logging
import requests
import json
from typing import Dict, List, Tuple, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionMLService:
    """
    Production ML service using HuggingFace Inference API
    Provides sentiment analysis, emotion detection, and stress level analysis
    """
    
    def __init__(self):
        """Initialize the production ML service"""
        self.hf_token = os.environ.get('HF_TOKEN')
        self.hf_api_url = "https://api-inference.huggingface.co/models"
        
        # Model endpoints
        self.sentiment_model = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        self.emotion_model = "j-hartmann/emotion-english-distilroberta-base"
        self.stress_model = "microsoft/DialoGPT-medium"  # We'll use this for stress analysis
        
        logger.info(f"Production ML Service initialized with HF token: {'Yes' if self.hf_token else 'No'}")
    
    def analyze_journal_entry(self, text: str) -> Dict:
        """
        Analyze journal entry using HuggingFace Inference API
        
        Args:
            text (str): Journal entry text to analyze
            
        Returns:
            Dict: Analysis results with sentiment, emotion, and stress level
        """
        if not text or not text.strip():
            return self._get_empty_analysis()
        
        try:
            # Get sentiment analysis
            sentiment_result = self._analyze_sentiment(text)
            
            # Get emotion analysis
            emotion_result = self._analyze_emotion(text)
            
            # Get stress level analysis
            stress_level = self._analyze_stress_level(text)
            
            # Combine results
            analysis = {
                "sentiment_score": sentiment_result["score"],
                "sentiment_label": sentiment_result["label"],
                "emotion": emotion_result["emotion"],
                "emotion_confidence": emotion_result["confidence"],
                "emotions_detected": emotion_result["emotions_detected"],
                "emotion_group": self._categorize_emotion_group(emotion_result["emotion"]),
                "stress_level": stress_level,
                "analysis_method": "huggingface_api",
                "analysis_confidence": (sentiment_result["confidence"] + emotion_result["confidence"]) / 2
            }
            
            logger.info(f"Analysis completed for text length: {len(text)}")
            return analysis
            
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            return self._get_fallback_analysis()
    
    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment using HuggingFace API"""
        try:
            response = self._query_hf_api(self.sentiment_model, text)
            
            if response and isinstance(response, list) and len(response) > 0:
                # Get the highest confidence result
                result = max(response, key=lambda x: x.get('score', 0))
                
                # Convert sentiment labels to scores (0-10 scale)
                label = result.get('label', 'NEUTRAL')
                confidence = result.get('score', 0.5)
                
                if 'LABEL_0' in label or 'NEGATIVE' in label:
                    score = 2.0 + (confidence * 3.0)  # 2-5 range
                elif 'LABEL_2' in label or 'POSITIVE' in label:
                    score = 7.0 + (confidence * 3.0)  # 7-10 range
                else:  # NEUTRAL
                    score = 4.0 + (confidence * 2.0)  # 4-6 range
                
                return {
                    "score": round(score, 2),
                    "label": self._normalize_sentiment_label(label),
                    "confidence": confidence
                }
            else:
                return self._get_default_sentiment()
                
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {str(e)}")
            return self._get_default_sentiment()
    
    def _analyze_emotion(self, text: str) -> Dict:
        """Analyze emotions using HuggingFace API"""
        try:
            response = self._query_hf_api(self.emotion_model, text)
            
            if response and isinstance(response, list) and len(response) > 0:
                # Get all emotions with their scores
                emotions = [(item.get('label', ''), item.get('score', 0)) for item in response]
                emotions = [(label, score) for label, score in emotions if score > 0.1]  # Filter low confidence
                
                # Get the dominant emotion
                dominant_emotion = max(emotions, key=lambda x: x[1]) if emotions else ('neutral', 0.5)
                
                return {
                    "emotion": self._normalize_emotion_label(dominant_emotion[0]),
                    "confidence": dominant_emotion[1],
                    "emotions_detected": emotions[:5]  # Top 5 emotions
                }
            else:
                return self._get_default_emotion()
                
        except Exception as e:
            logger.error(f"Emotion analysis failed: {str(e)}")
            return self._get_default_emotion()
    
    def _analyze_stress_level(self, text: str) -> float:
        """Analyze stress level based on text content"""
        try:
            # Simple keyword-based stress analysis
            stress_keywords = [
                'stressed', 'stress', 'anxious', 'anxiety', 'worried', 'worry',
                'overwhelmed', 'pressure', 'deadline', 'urgent', 'panic',
                'tired', 'exhausted', 'burnout', 'frustrated', 'frustration',
                'angry', 'mad', 'upset', 'sad', 'depressed', 'hopeless'
            ]
            
            text_lower = text.lower()
            stress_count = sum(1 for keyword in stress_keywords if keyword in text_lower)
            
            # Calculate stress level (0-10 scale)
            if stress_count == 0:
                stress_level = 2.0
            elif stress_count <= 2:
                stress_level = 4.0 + (stress_count * 1.0)
            elif stress_count <= 5:
                stress_level = 6.0 + (stress_count * 0.8)
            else:
                stress_level = min(10.0, 8.0 + (stress_count * 0.3))
            
            return round(stress_level, 2)
            
        except Exception as e:
            logger.error(f"Stress analysis failed: {str(e)}")
            return 5.0  # Default moderate stress
    
    def _query_hf_api(self, model: str, text: str) -> Optional[List]:
        """Query HuggingFace Inference API"""
        if not self.hf_token:
            logger.warning("No HuggingFace token available")
            return None
        
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        data = {"inputs": text}
        
        try:
            response = requests.post(
                f"{self.hf_api_url}/{model}",
                headers=headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"HF API query failed: {str(e)}")
            return None
    
    def _normalize_sentiment_label(self, label: str) -> str:
        """Normalize sentiment labels"""
        label = label.upper()
        if 'NEGATIVE' in label or 'LABEL_0' in label:
            return 'negative'
        elif 'POSITIVE' in label or 'LABEL_2' in label:
            return 'positive'
        else:
            return 'neutral'
    
    def _normalize_emotion_label(self, label: str) -> str:
        """Normalize emotion labels"""
        label = label.lower()
        emotion_map = {
            'joy': 'joy',
            'happiness': 'joy',
            'sadness': 'sadness',
            'anger': 'anger',
            'fear': 'fear',
            'surprise': 'surprise',
            'disgust': 'disgust',
            'love': 'joy',
            'excitement': 'joy',
            'anxiety': 'fear',
            'worry': 'fear',
            'frustration': 'anger',
            'contentment': 'joy',
            'peaceful': 'joy'
        }
        return emotion_map.get(label, 'neutral')
    
    def _categorize_emotion_group(self, emotion: str) -> str:
        """Categorize emotion into positive/negative/neutral groups"""
        positive_emotions = ['joy', 'happiness', 'excitement', 'love', 'contentment', 'peaceful']
        negative_emotions = ['sadness', 'anger', 'fear', 'anxiety', 'worry', 'frustration', 'disgust']
        
        if emotion in positive_emotions:
            return 'positive'
        elif emotion in negative_emotions:
            return 'negative'
        else:
            return 'neutral'
    
    def _get_empty_analysis(self) -> Dict:
        """Return empty analysis for empty text"""
        return {
            "sentiment_score": 5.0,
            "sentiment_label": "neutral",
            "emotion": "neutral",
            "emotion_confidence": 0.0,
            "emotions_detected": [],
            "emotion_group": "neutral",
            "stress_level": 3.0,
            "analysis_method": "empty",
            "analysis_confidence": 0.0
        }
    
    def _get_fallback_analysis(self) -> Dict:
        """Return fallback analysis when API fails"""
        return {
            "sentiment_score": 5.0,
            "sentiment_label": "neutral",
            "emotion": "neutral",
            "emotion_confidence": 0.5,
            "emotions_detected": [["neutral", 0.5]],
            "emotion_group": "neutral",
            "stress_level": 3.0,
            "analysis_method": "fallback",
            "analysis_confidence": 0.5
        }
    
    def _get_default_sentiment(self) -> Dict:
        """Default sentiment when API fails"""
        return {
            "score": 5.0,
            "label": "neutral",
            "confidence": 0.5
        }
    
    def _get_default_emotion(self) -> Dict:
        """Default emotion when API fails"""
        return {
            "emotion": "neutral",
            "confidence": 0.5,
            "emotions_detected": [["neutral", 0.5]]
        }
    
    def get_available_methods(self) -> Dict:
        """Get information about available analysis methods"""
        return {
            "huggingface_available": bool(self.hf_token),
            "current_method": "huggingface_api" if self.hf_token else "fallback",
            "environment_variables": {
                "HF_TOKEN": "***" if self.hf_token else "Not set"
            }
        }

# Global service instance
production_ml_service = ProductionMLService()

def analyze_journal_entry(text: str) -> Dict:
    """
    Main function to analyze a journal entry using the production ML service
    
    Args:
        text (str): The journal entry text
        
    Returns:
        Dict: Analysis results
    """
    return production_ml_service.analyze_journal_entry(text)
