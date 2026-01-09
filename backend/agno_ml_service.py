import os
import logging
from typing import Dict, List, Tuple, Optional
import json
from pathlib import Path
from dotenv import load_dotenv
import requests
import time

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgnoSentimentAnalyzer:
    """
    Enhanced sentiment analyzer using HuggingFace Inference API.
    This provides a more reliable approach to sentiment analysis using cloud-based models.
    """
    
    def __init__(self):
        """Initialize the HuggingFace Inference API-based sentiment analyzer"""
        self.hf_token = os.environ.get('HF_TOKEN')
        self.api_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {self.hf_token}"} if self.hf_token else {}
        
        if not self.hf_token:
            logger.warning("HF_TOKEN not found. HuggingFace API will not be available.")
            self.agno_enabled = False
        else:
            self.agno_enabled = True
            logger.info("HuggingFace Inference API initialized successfully")
    
    def analyze_journal_entry(self, text: str) -> Dict:
        """
        Analyze journal entry using Agno agents
        
        Args:
            text (str): Journal entry text to analyze
            
        Returns:
            Dict: Analysis results with sentiment, emotion, and insights
        """
        if not self.agno_enabled:
            return self._fallback_analysis(text)
        
        try:
            # Clean text
            text = text.strip()
            if not text:
                return self._get_empty_analysis()
            
            # Analyze sentiment
            sentiment_result = self._analyze_sentiment_agno(text)
            
            # Analyze emotions
            emotion_result = self._analyze_emotion_agno(text)
            
            # Generate insights
            insights = self._generate_insights_agno(text, sentiment_result, emotion_result)
            
            # Calculate stress level
            stress_level = self._calculate_stress_level(text, sentiment_result, emotion_result)
            
            # Get embeddings for semantic analysis
            # embeddings = self._get_embeddings(text)
            embeddings = None
            
            return {
                "sentiment_score": sentiment_result["score"],
                "sentiment_label": sentiment_result["label"],
                "emotion": emotion_result["primary_emotion"],
                "emotion_confidence": emotion_result["confidence"],
                "emotions_detected": emotion_result["all_emotions"],
                "emotion_group": emotion_result["emotion_group"],
                "stress_level": stress_level,
                "insights": insights,
                "embeddings": embeddings,
                "analysis_method": "agno",
                "analysis_confidence": min(sentiment_result["confidence"], emotion_result["confidence"])
            }
            
        except Exception as e:
            logger.error(f"Error in Agno analysis: {e}")
            return self._fallback_analysis(text)
    
    def _analyze_sentiment_agno(self, text: str) -> Dict:
        """Analyze sentiment using HuggingFace Inference API and return score on 0-10 scale"""
        try:
            if not self.agno_enabled:
                return {"label": "neutral", "score": 5.0, "confidence": 0.5}
            
            # Use HuggingFace Inference API for sentiment analysis
            model_url = f"{self.api_url}/cardiffnlp/twitter-roberta-base-sentiment-latest"
            payload = {
                "inputs": text,
                "parameters": {"top_k": 3},
                "options": {"wait_for_model": True},
            }
            
            response = requests.post(model_url, headers=self.headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                results = response.json()
                
                # Find the highest scoring sentiment
                best_result = max(results[0], key=lambda x: x['score'])
                
                # Map sentiment labels to our format
                label_mapping = {
                    'LABEL_0': 'negative',
                    'LABEL_1': 'neutral', 
                    'LABEL_2': 'positive',
                    'negative': 'negative',
                    'neutral': 'neutral',
                    'positive': 'positive'
                }
                
                sentiment_label = label_mapping.get(best_result['label'], 'neutral')
                confidence = float(best_result['score'])

                # Normalize to 0-10 scale to match frontend/dashboard expectations
                # Positive: 5 -> 10, Negative: 5 -> 0, Neutral: 5.0
                if sentiment_label == 'positive':
                    normalized_score = 5.0 + (confidence * 5.0)
                elif sentiment_label == 'negative':
                    normalized_score = 5.0 - (confidence * 5.0)
                else:
                    normalized_score = 5.0
                
                return {
                    "label": sentiment_label,
                    "score": round(normalized_score, 3),
                    "confidence": round(confidence, 3)
                }
            else:
                logger.error(f"HuggingFace API error: {response.status_code}")
                return {"label": "neutral", "score": 5.0, "confidence": 0.5}
                
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {"label": "neutral", "score": 5.0, "confidence": 0.5}
    
    def _analyze_emotion_agno(self, text: str) -> Dict:
        """Analyze emotions using HuggingFace Inference API"""
        try:
            if not self.agno_enabled:
                return {
                    "primary_emotion": "neutral",
                    "confidence": 0.5,
                    "all_emotions": [["neutral", 0.5]],
                    "emotion_group": "neutral"
                }
            
            # Use HuggingFace Inference API for emotion analysis (GoEmotions)
            # GoEmotions offers finer-grained multi-label emotions and tends to improve perceived accuracy
            model_url = f"{self.api_url}/SamLowe/roberta-base-go_emotions"
            payload = {
                "inputs": text,
                # Request multiple top emotions to better capture nuanced states
                "parameters": {"top_k": 6},
                "options": {"wait_for_model": True},
            }
            
            response = requests.post(model_url, headers=self.headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                results = response.json()

                # HF Inference returns list of dicts for top_k classification
                candidates = results[0] if isinstance(results, list) else results
                # Normalize to list
                if isinstance(candidates, dict):
                    candidates = [candidates]

                # Keep meaningful emotions (threshold)
                filtered = [c for c in candidates if float(c.get("score", 0.0)) >= 0.1]
                # Sort by score desc and cap to 5
                filtered.sort(key=lambda x: x.get("score", 0.0), reverse=True)
                top_emotions = filtered[:5] if filtered else (candidates[:1] if candidates else [])

                # Primary emotion
                primary = top_emotions[0] if top_emotions else {"label": "neutral", "score": 0.5}
                primary_label = str(primary.get("label", "neutral")).lower()
                primary_score = float(primary.get("score", 0.5))

                # Emotion grouping (broad buckets)
                positive_emotions = ['admiration','amusement','approval','caring','excitement',
                                     'gratitude','joy','love','optimism','pride','relief']
                negative_emotions = ['anger','annoyance','disappointment','disapproval','disgust',
                                     'embarrassment','fear','grief','nervousness','remorse','sadness','shame','guilt']
                emotion_group = "neutral"
                if primary_label in positive_emotions:
                    emotion_group = "positive"
                elif primary_label in negative_emotions:
                    emotion_group = "negative"

                all_emotions = [[str(e.get("label","")).lower(), round(float(e.get("score",0.0)), 3)] for e in top_emotions]
                
                return {
                    "primary_emotion": primary_label,
                    "confidence": round(primary_score, 3),
                    "all_emotions": all_emotions,
                    "emotion_group": emotion_group
                }
            else:
                logger.error(f"HuggingFace API error: {response.status_code}")
                return {
                    "primary_emotion": "neutral",
                    "confidence": 0.5,
                    "all_emotions": [["neutral", 0.5]],
                    "emotion_group": "neutral"
                }
                
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}")
            return {
                "primary_emotion": "neutral",
                "confidence": 0.5,
                "all_emotions": [["neutral", 0.5]],
                "emotion_group": "neutral"
            }
    
    def _generate_insights_agno(self, text: str, sentiment_result: Dict, emotion_result: Dict) -> List[str]:
        """Generate insights using rule-based approach with enhanced logic"""
        try:
            # Use the enhanced fallback insights method
            return self._get_fallback_insights(sentiment_result, emotion_result)
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return ["Thank you for sharing your thoughts. Consider reflecting on what brings you joy."]
    
    def _get_fallback_insights(self, sentiment_result: Dict, emotion_result: Dict) -> List[str]:
        """Generate fallback insights based on sentiment and emotion"""
        insights = []
        
        sentiment = sentiment_result.get('label', 'neutral')
        emotion = emotion_result.get('primary_emotion', 'neutral')
        
        if sentiment == 'positive':
            insights.append("It's wonderful to see positive energy in your writing!")
            insights.append("Consider what contributed to these good feelings today.")
        elif sentiment == 'negative':
            insights.append("Thank you for sharing your feelings. It's okay to have difficult days.")
            insights.append("Consider what small steps might help you feel better.")
        else:
            insights.append("Thank you for taking time to reflect on your day.")
            insights.append("Consider what stood out to you most today.")
        
        if 'joy' in emotion or 'happiness' in emotion:
            insights.append("Your joy is contagious! What brought you this happiness?")
        elif 'sadness' in emotion or 'grief' in emotion:
            insights.append("It's natural to feel sad sometimes. Be gentle with yourself.")
        elif 'anger' in emotion or 'frustration' in emotion:
            insights.append("Anger can be a signal that something needs attention.")
        
        return insights[:3]
    
    def _calculate_stress_level(self, text: str, sentiment_result: Dict, emotion_result: Dict) -> float:
        """Calculate stress level based on analysis results and return 0-10 scale"""
        try:
            # Base stress from sentiment
            sentiment_stress_unit = 0.0
            if sentiment_result["label"] == "negative":
                # Use confidence where available (fall back to distance from neutral on 0-10 scale)
                conf = float(sentiment_result.get("confidence", 0.6))
                sentiment_stress_unit = min(1.0, conf)
            elif sentiment_result["label"] == "positive":
                sentiment_stress_unit = 0.1
            
            # Stress from emotions
            emotion_stress_unit = 0.0
            if emotion_result["emotion_group"] == "negative":
                emotion_stress_unit = 0.3
            elif emotion_result["emotion_group"] == "positive":
                emotion_stress_unit = 0.1
            
            # Keyword-based stress indicators
            stress_keywords = ['stressed', 'anxious', 'worried', 'overwhelmed', 'pressure', 'deadline']
            keyword_stress_unit = sum(0.1 for keyword in stress_keywords if keyword.lower() in text.lower())
            
            # Combine all stress factors
            total_stress_unit = min(sentiment_stress_unit + emotion_stress_unit + keyword_stress_unit, 1.0)

            # Convert 0-1 unit scale to 0-10 display scale
            return round(total_stress_unit * 10.0, 1)
            
        except Exception as e:
            logger.error(f"Error calculating stress level: {e}")
            return 3.0
    
    # def _get_embeddings(self, text: str) -> Optional[List[float]]:
    #     """Get text embeddings for semantic analysis"""
    #     try:
    #         if self.embedder:
    #             return self.embedder.get_embedding(text)
    #         return None
    #     except Exception as e:
    #         logger.error(f"Error getting embeddings: {e}")
    #         return None
    
    def _parse_sentiment_response(self, response: str) -> Dict:
        """Fallback parsing for sentiment response"""
        response_lower = response.lower()
        if "positive" in response_lower:
            return {"label": "positive", "score": 0.7, "confidence": 0.8}
        elif "negative" in response_lower:
            return {"label": "negative", "score": -0.7, "confidence": 0.8}
        else:
            return {"label": "neutral", "score": 0.0, "confidence": 0.6}
    
    def _parse_emotion_response(self, response: str) -> Dict:
        """Fallback parsing for emotion response"""
        response_lower = response.lower()
        emotions = ["joy", "sadness", "anger", "fear", "surprise", "love", "neutral"]
        detected_emotion = "neutral"
        
        for emotion in emotions:
            if emotion in response_lower:
                detected_emotion = emotion
                break
        
        return {
            "primary_emotion": detected_emotion,
            "confidence": 0.6,
            "all_emotions": [[detected_emotion, 0.6]],
            "emotion_group": "positive" if detected_emotion in ["joy", "love"] else 
                           "negative" if detected_emotion in ["sadness", "anger", "fear"] else "neutral"
        }
    
    def _fallback_analysis(self, text: str) -> Dict:
        """Fallback analysis when Agno is not available (normalized to app scales)"""
        return {
            "sentiment_score": 5.0,
            "sentiment_label": "neutral",
            "emotion": "neutral",
            "emotion_confidence": 0.5,
            "emotions_detected": [["neutral", 0.5]],
            "emotion_group": "neutral",
            "stress_level": 3.0,
            "insights": ["Thank you for sharing your thoughts."],
            "embeddings": None,
            "analysis_method": "fallback",
            "analysis_confidence": 0.5
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
            "insights": ["Please write something to get analysis."],
            "embeddings": None,
            "analysis_method": "empty",
            "analysis_confidence": 0.0
        }

# Global analyzer instance
agno_analyzer = AgnoSentimentAnalyzer()

def analyze_journal_entry_agno(text: str) -> Dict:
    """
    Public function to analyze a journal entry using Agno framework
    
    Args:
        text (str): The journal entry text
        
    Returns:
        Dict: Analysis results
    """
    return agno_analyzer.analyze_journal_entry(text)
