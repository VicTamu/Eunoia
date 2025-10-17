import re
import logging
from typing import Dict, List, Tuple
import random
import numpy as np
import os
from error_handler import ErrorHandler, ErrorFactory, ErrorCode, ErrorSeverity, error_handler, error_factory

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        """Initialize the sentiment analysis models with GoEmotions support"""
        self.sentiment_pipeline = None
        self.emotion_pipeline = None
        self.goemotions_pipeline = None
        self.goemotions_labels = None
        
        # GoEmotions 27 emotion categories
        self.goemotions_categories = [
            'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
            'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
            'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
            'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
            'relief', 'remorse', 'sadness', 'surprise'
        ]
        
        # Emotion grouping for better analysis
        self.emotion_groups = {
            'positive': ['admiration', 'amusement', 'approval', 'caring', 'excitement', 
                        'gratitude', 'joy', 'love', 'optimism', 'pride', 'relief'],
            'negative': ['anger', 'annoyance', 'disappointment', 'disapproval', 'disgust',
                        'embarrassment', 'fear', 'grief', 'nervousness', 'remorse', 'sadness'],
            'neutral': ['confusion', 'curiosity', 'desire', 'realization', 'surprise']
        }
        
        # Stress-related emotions from GoEmotions
        self.stress_emotions = ['fear', 'nervousness', 'anxiety', 'worry', 'stress', 'pressure']
        
        self.stress_keywords = [
            'stressed', 'stress', 'anxious', 'anxiety', 'worried', 'worry',
            'overwhelmed', 'pressure', 'tension', 'nervous', 'panic',
            'frustrated', 'frustration', 'burnout', 'exhausted', 'tired',
            'deadline', 'urgent', 'rushed', 'busy', 'hectic'
        ]
        self.positive_keywords = [
            'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic',
            'love', 'loved', 'enjoy', 'enjoyed', 'pleased', 'delighted', 'thrilled',
            'grateful', 'thankful', 'blessed', 'fortunate', 'lucky', 'successful',
            'accomplished', 'proud', 'confident', 'optimistic', 'hopeful', 'cheerful'
        ]
        self.negative_keywords = [
            'sad', 'depressed', 'down', 'upset', 'disappointed', 'frustrated',
            'angry', 'mad', 'annoyed', 'irritated', 'hurt', 'pain', 'suffering',
            'worried', 'anxious', 'scared', 'afraid', 'terrified', 'hopeless',
            'helpless', 'lonely', 'isolated', 'rejected', 'abandoned', 'broken'
        ]
        self.emotion_keywords = {
            'joy': ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'cheerful', 'ecstatic'],
            'sadness': ['sad', 'depressed', 'down', 'upset', 'melancholy', 'gloomy', 'sorrowful'],
            'anger': ['angry', 'mad', 'furious', 'rage', 'irritated', 'annoyed', 'frustrated'],
            'fear': ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'nervous', 'panic'],
            'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered'],
            'disgust': ['disgusted', 'revolted', 'sickened', 'repulsed', 'appalled', 'horrified'],
            'love': ['love', 'loved', 'adore', 'cherish', 'treasure', 'affection', 'romance'],
            'neutral': ['okay', 'fine', 'normal', 'regular', 'usual', 'standard', 'average']
        }

        # Defer heavy model loading unless enabled
        self.models_enabled = os.environ.get('EUNOIA_ENABLE_MODELS', '0') in ('1', 'true', 'True')
        if self.models_enabled:
            self._load_models()
        else:
            logger.info("Model loading disabled (EUNOIA_ENABLE_MODELS not set). Using rule-based fallback.")
    
    def _load_models(self):
        """Load pre-trained models from Hugging Face including GoEmotions"""
        try:
            # Try to import transformers
            from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
            import torch
            
            # Sentiment analysis model (positive/negative/neutral)
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                return_all_scores=True
            )
            
            # GoEmotions model for detailed emotion classification
            try:
                self.goemotions_pipeline = pipeline(
                    "text-classification",
                    model="TuhinG/distilbert-goemotions",
                    return_all_scores=True,
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("GoEmotions model loaded successfully")
            except Exception as goe_error:
                logger.warning(f"Could not load GoEmotions model: {goe_error}")
                # Fallback to basic emotion model
                self.emotion_pipeline = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    return_all_scores=True
                )
                logger.info("Using fallback emotion model")
            
            logger.info("Hugging Face models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load Hugging Face models: {e}")
            logger.info("Falling back to rule-based analysis")
            self.sentiment_pipeline = None
            self.emotion_pipeline = None
            self.goemotions_pipeline = None
    
    def analyze_text(self, text: str) -> Dict:
        """
        Analyze text for sentiment, emotion, and stress level using GoEmotions
        
        Args:
            text (str): The journal entry text to analyze
            
        Returns:
            Dict: Analysis results containing sentiment, emotion, and stress level
        """
        context = error_handler.create_error_context(
            endpoint="ml_analysis",
            additional_data={"text_length": len(text) if text else 0}
        )
        
        try:
            # Clean and prepare text
            text = text.strip().lower()
            
            if not text:
                return self._get_fallback_analysis()
            
            # Sentiment analysis
            sentiment_result = self._analyze_sentiment(text)
            
            # Enhanced emotion analysis with GoEmotions
            emotion_result = self._analyze_emotion_goemotions(text)
            
            # Enhanced stress level analysis
            stress_level = self._analyze_stress_enhanced(text, emotion_result)
            
            return {
                "sentiment_score": sentiment_result["score"],
                "sentiment_label": sentiment_result["label"],
                "emotion": emotion_result["primary_emotion"],
                "emotion_confidence": emotion_result["confidence"],
                "emotions_detected": emotion_result["all_emotions"],
                "emotion_group": emotion_result["emotion_group"],
                "stress_level": stress_level,
                "analysis_confidence": min(sentiment_result["confidence"], emotion_result["confidence"])
            }
            
        except Exception as e:
            error = error_factory.ml_service_error(
                message="Text analysis failed",
                detail=str(e),
                context=context,
                original_exception=e
            )
            error_handler.log_error(error)
            return self._get_fallback_analysis()
    
    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of the text"""
        try:
            if self.sentiment_pipeline:
                results = self.sentiment_pipeline(text)
                
                # Handle different model output formats
                if isinstance(results[0], list):
                    # Multiple scores format
                    scores = {item['label']: item['score'] for item in results[0]}
                    if 'LABEL_0' in scores:
                        # Convert to readable labels
                        label_map = {'LABEL_0': 'negative', 'LABEL_1': 'neutral', 'LABEL_2': 'positive'}
                        scores = {label_map.get(k, k): v for k, v in scores.items()}
                    
                    # Get the highest scoring sentiment
                    best_sentiment = max(scores.items(), key=lambda x: x[1])
                    return {
                        "label": best_sentiment[0],
                        "score": self._normalize_sentiment_score(best_sentiment[0], best_sentiment[1]),
                        "confidence": best_sentiment[1]
                    }
                else:
                    # Single result format
                    result = results[0]
                    return {
                        "label": result['label'].lower(),
                        "score": self._normalize_sentiment_score(result['label'], result['score']),
                        "confidence": result['score']
                    }
            else:
                # Rule-based sentiment analysis
                return self._rule_based_sentiment(text)
                
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return self._rule_based_sentiment(text)
    
    def _analyze_emotion(self, text: str) -> Dict:
        """Analyze emotion of the text"""
        try:
            if self.emotion_pipeline:
                results = self.emotion_pipeline(text)
                
                if isinstance(results[0], list):
                    # Multiple emotions format
                    emotions = {item['label']: item['score'] for item in results[0]}
                    best_emotion = max(emotions.items(), key=lambda x: x[1])
                    return {
                        "label": best_emotion[0],
                        "confidence": best_emotion[1]
                    }
                else:
                    # Single emotion format
                    result = results[0]
                    return {
                        "label": result['label'],
                        "confidence": result['score']
                    }
            else:
                # Rule-based emotion analysis
                return self._rule_based_emotion(text)
                
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}")
            return self._rule_based_emotion(text)
    
    def _analyze_emotion_goemotions(self, text: str) -> Dict:
        """Enhanced emotion analysis using GoEmotions model"""
        try:
            if self.goemotions_pipeline:
                results = self.goemotions_pipeline(text)
                
                if isinstance(results[0], list):
                    # Multi-label emotion classification
                    emotions = {item['label']: item['score'] for item in results[0]}
                    
                    # Get top emotions (threshold > 0.1)
                    top_emotions = [(emotion, score) for emotion, score in emotions.items() 
                                  if score > 0.1]
                    top_emotions.sort(key=lambda x: x[1], reverse=True)
                    
                    # Primary emotion (highest score)
                    primary_emotion = top_emotions[0][0] if top_emotions else 'neutral'
                    primary_confidence = top_emotions[0][1] if top_emotions else 0.5
                    
                    # Determine emotion group
                    emotion_group = self._get_emotion_group(primary_emotion)
                    
                    return {
                        "primary_emotion": primary_emotion,
                        "confidence": primary_confidence,
                        "all_emotions": top_emotions[:5],  # Top 5 emotions
                        "emotion_group": emotion_group
                    }
                else:
                    # Single emotion result
                    result = results[0]
                    emotion_group = self._get_emotion_group(result['label'])
                    return {
                        "primary_emotion": result['label'],
                        "confidence": result['score'],
                        "all_emotions": [(result['label'], result['score'])],
                        "emotion_group": emotion_group
                    }
            else:
                # Fallback to basic emotion analysis
                basic_result = self._analyze_emotion(text)
                return {
                    "primary_emotion": basic_result["label"],
                    "confidence": basic_result["confidence"],
                    "all_emotions": [(basic_result["label"], basic_result["confidence"])],
                    "emotion_group": self._get_emotion_group(basic_result["label"])
                }
                
        except Exception as e:
            logger.error(f"Error in GoEmotions analysis: {e}")
            basic_result = self._analyze_emotion(text)
            return {
                "primary_emotion": basic_result["label"],
                "confidence": basic_result["confidence"],
                "all_emotions": [(basic_result["label"], basic_result["confidence"])],
                "emotion_group": self._get_emotion_group(basic_result["label"])
            }
    
    def _get_emotion_group(self, emotion: str) -> str:
        """Determine emotion group (positive/negative/neutral)"""
        for group, emotions in self.emotion_groups.items():
            if emotion in emotions:
                return group
        return 'neutral'
    
    def _analyze_stress_enhanced(self, text: str, emotion_result: Dict) -> float:
        """Enhanced stress analysis using GoEmotions emotional context (0-10 scale)"""
        try:
            # Base stress from keywords
            stress_count = sum(1 for keyword in self.stress_keywords if keyword in text)
            keyword_stress = min(stress_count * 1.0, 8.0)  # 0-8 range
            
            # Enhanced stress from GoEmotions
            emotion_stress = 0.0
            if emotion_result.get('emotion_group') == 'negative':
                # Check for high-stress emotions
                primary_emotion = emotion_result.get('primary_emotion', '')
                if primary_emotion in ['fear', 'nervousness', 'anxiety', 'worry']:
                    emotion_stress = 6.0
                elif primary_emotion in ['anger', 'frustration', 'annoyance']:
                    emotion_stress = 4.0
                elif primary_emotion in ['sadness', 'grief', 'disappointment']:
                    emotion_stress = 3.0
                else:
                    emotion_stress = 2.0
            
            # Additional stress indicators
            stress_indicators = ['!', 'urgent', 'asap', 'deadline', 'pressure', 'overwhelmed']
            indicator_count = sum(1 for indicator in stress_indicators if indicator in text)
            indicator_stress = min(indicator_count * 0.5, 2.0)  # 0-2 range
            
            # Combine all stress factors
            total_stress = min(keyword_stress + emotion_stress + indicator_stress, 10.0)
            
            return round(total_stress, 1)
            
        except Exception as e:
            logger.error(f"Error in enhanced stress analysis: {e}")
            return self._analyze_stress(text)
    
    def _analyze_stress(self, text: str) -> float:
        """Analyze stress level based on keywords and sentiment (0-10 scale)"""
        try:
            stress_count = sum(1 for keyword in self.stress_keywords if keyword in text)
            
            # Base stress level from keyword count
            keyword_stress = min(stress_count * 1.0, 8.0)  # 0-8 range
            
            # Additional stress indicators
            stress_indicators = ['!', 'urgent', 'asap', 'deadline', 'pressure']
            indicator_count = sum(1 for indicator in stress_indicators if indicator in text)
            indicator_stress = min(indicator_count * 0.5, 2.0)  # 0-2 range
            
            # Combine keyword and indicator stress
            total_stress = min(keyword_stress + indicator_stress, 10.0)
            
            return round(total_stress, 1)
            
        except Exception as e:
            logger.error(f"Error in stress analysis: {e}")
            return 3.0  # Default moderate stress level (0-10 scale)
    
    def _normalize_sentiment_score(self, label: str, confidence: float) -> float:
        """Convert sentiment label and confidence to a normalized score (0 to 10)"""
        label = label.lower()
        if 'positive' in label:
            return 5 + (confidence * 5)  # 5-10 range
        elif 'negative' in label:
            return 5 - (confidence * 5)  # 0-5 range
        else:  # neutral
            return 5.0
    
    def _get_fallback_analysis(self) -> Dict:
        """Return fallback analysis when models fail"""
        return {
            "sentiment_score": 5.0,
            "sentiment_label": "neutral",
            "emotion": "neutral",
            "emotion_confidence": 0.5,
            "emotions_detected": [("neutral", 0.5)],
            "emotion_group": "neutral",
            "stress_level": 3.0,
            "analysis_confidence": 0.5
        }
    
    def _get_fallback_sentiment(self) -> Dict:
        """Return fallback sentiment analysis"""
        return {
            "label": "neutral",
            "score": 0.0,
            "confidence": 0.5
        }
    
    def _get_fallback_emotion(self) -> Dict:
        """Return fallback emotion analysis"""
        return {
            "label": "neutral",
            "confidence": 0.5
        }
    
    def _rule_based_sentiment(self, text: str) -> Dict:
        """Rule-based sentiment analysis using keyword matching (0-10 scale)"""
        text_lower = text.lower()
        
        positive_count = sum(1 for word in self.positive_keywords if word in text_lower)
        negative_count = sum(1 for word in self.negative_keywords if word in text_lower)
        
        # Check for intensifiers
        intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely']
        intensifier_count = sum(1 for word in intensifiers if word in text_lower)
        
        # Calculate sentiment score (0-10 scale)
        if positive_count > negative_count:
            score = min(5.0 + (positive_count * 1.0) + (intensifier_count * 0.5), 10.0)
            label = "positive"
        elif negative_count > positive_count:
            score = max(5.0 - (negative_count * 1.0) - (intensifier_count * 0.5), 0.0)
            label = "negative"
        else:
            score = 5.0
            label = "neutral"
        
        confidence = min(0.5 + abs(score - 5.0) * 0.1, 1.0)
        
        return {
            "label": label,
            "score": score,
            "confidence": confidence
        }
    
    def _rule_based_emotion(self, text: str) -> Dict:
        """Rule-based emotion analysis using keyword matching"""
        text_lower = text.lower()
        
        emotion_scores = {}
        for emotion, keywords in self.emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            emotion_scores[emotion] = score
        
        # Get the emotion with the highest score
        if max(emotion_scores.values()) > 0:
            best_emotion = max(emotion_scores.items(), key=lambda x: x[1])
            confidence = min(0.3 + (best_emotion[1] * 0.2), 1.0)
            return {
                "label": best_emotion[0],
                "confidence": confidence
            }
        else:
            return {
                "label": "neutral",
                "confidence": 0.5
            }

# Global analyzer instance
analyzer = SentimentAnalyzer()

def analyze_journal_entry(text: str) -> Dict:
    """
    Public function to analyze a journal entry
    
    Args:
        text (str): The journal entry text
        
    Returns:
        Dict: Analysis results
    """
    return analyzer.analyze_text(text)
