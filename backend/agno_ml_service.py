import os
import logging
from typing import Dict, List, Tuple, Optional
import json
import re
from pathlib import Path
from dotenv import load_dotenv
import requests

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
        self.api_url = "https://router.huggingface.co"
        self.headers = {"Authorization": f"Bearer {self.hf_token}"} if self.hf_token else {}
        self.chat_model = os.environ.get(
            "EUNOIA_HF_CHAT_MODEL", "HuggingFaceTB/SmolLM3-3B:hf-inference"
        )
        self.positive_cues = {
            "grateful": 0.8,
            "thankful": 0.8,
            "proud": 0.7,
            "relaxed": 0.7,
            "calm": 0.6,
            "joyful": 0.8,
            "happy": 0.6,
            "excited": 0.7,
            "hopeful": 0.5,
            "relieved": 0.7,
            "accomplished": 0.7,
            "sunshine": 0.4,
            "wonderful": 0.8,
            "supportive": 0.4,
        }
        self.negative_cues = {
            "anxious": 0.9,
            "anxiety": 0.9,
            "overwhelmed": 1.0,
            "deadline": 0.7,
            "deadlines": 0.7,
            "pressure": 0.8,
            "worried": 0.7,
            "worry": 0.7,
            "stressed": 0.9,
            "stress": 0.8,
            "hectic": 0.6,
            "raced": 0.5,
            "can’t focus": 0.7,
            "can't focus": 0.7,
            "afraid": 0.8,
            "mess this up": 0.9,
            "frustrated": 0.7,
            "burned out": 1.0,
        }
        self.emotion_valence = {
            "joy": 1.2,
            "gratitude": 1.2,
            "relief": 1.0,
            "optimism": 0.8,
            "pride": 0.9,
            "love": 1.0,
            "excitement": 0.9,
            "admiration": 0.6,
            "approval": 0.5,
            "caring": 0.5,
            "neutral": 0.0,
            "curiosity": 0.1,
            "realization": -0.1,
            "surprise": 0.0,
            "sadness": -1.1,
            "grief": -1.4,
            "fear": -1.3,
            "nervousness": -1.2,
            "anger": -1.1,
            "annoyance": -0.7,
            "disappointment": -0.8,
            "remorse": -0.9,
            "disgust": -1.0,
            "embarrassment": -0.7,
        }
        self.stress_weights = {
            "fear": 4.0,
            "nervousness": 3.8,
            "anger": 2.8,
            "annoyance": 2.3,
            "disappointment": 1.8,
            "sadness": 1.6,
            "grief": 2.4,
            "remorse": 1.8,
            "surprise": 1.0,
            "joy": -1.8,
            "gratitude": -1.6,
            "relief": -1.4,
            "calm": -1.4,
            "optimism": -1.0,
        }
        
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

            # Prefer the router-based LLM path for deeper, more human analysis.
            llm_result = self._analyze_with_chat_completion(text)
            if llm_result is not None:
                llm_result["analysis_method"] = "agno"
                return llm_result
            
            # Analyze sentiment
            sentiment_result = self._analyze_sentiment_agno(text)
            
            # Analyze emotions
            emotion_result = self._analyze_emotion_agno(text)

            # Refine sentiment with emotional and lexical context so technical entries
            # with gratitude, stress, or relief don't get flattened into "neutral".
            sentiment_result = self._refine_sentiment_with_context(
                text, sentiment_result, emotion_result
            )
            
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

    def _analyze_with_chat_completion(self, text: str) -> Optional[Dict]:
        if not self.agno_enabled:
            return None

        url = f"{self.api_url}/v1/chat/completions"
        payload = {
            "model": self.chat_model,
            "temperature": 0.2,
            "max_tokens": 420,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You analyze journal entries with empathy and precision. "
                        "Return valid JSON only. "
                        "Use these keys exactly: sentiment_score, sentiment_label, emotion, "
                        "emotion_confidence, emotions_detected, emotion_group, stress_level, "
                        "insights, analysis_confidence. "
                        "sentiment_score and stress_level must be numbers from 0.0 to 10.0. "
                        "emotion_confidence and analysis_confidence must be 0.0 to 1.0. "
                        "sentiment_label must be positive, neutral, or negative. "
                        "emotion_group must be positive, neutral, or negative. "
                        "emotion must be a lowercase single primary emotion. "
                        "emotions_detected must be an array of up to 4 [emotion, confidence] pairs. "
                        "insights must be an array of 2 or 3 short, human-sounding observations that reflect the actual entry."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze this journal entry and be nuanced rather than flattening mixed emotions.\n\n"
                        f"Journal entry:\n{text}"
                    ),
                },
            ],
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=45)
            if response.status_code != 200:
                logger.error(f"HuggingFace chat completion error: {response.status_code} {response.text[:200]}")
                return None

            data = response.json()
            content = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            parsed = self._parse_chat_analysis(content)
            return parsed
        except Exception as e:
            logger.error(f"Error in HuggingFace chat completion analysis: {e}")
            return None

    def _parse_chat_analysis(self, content: str) -> Optional[Dict]:
        if not content:
            return None

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if not match:
                return None
            try:
                parsed = json.loads(match.group(0))
            except json.JSONDecodeError:
                return None

        emotions_raw = parsed.get("emotions_detected", []) or []
        emotions_detected: List[List[object]] = []
        for item in emotions_raw[:4]:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                emotions_detected.append([str(item[0]).lower(), round(float(item[1]), 3)])

        sentiment_score = round(max(0.0, min(10.0, float(parsed.get("sentiment_score", 5.0)))), 3)
        stress_level = round(max(0.0, min(10.0, float(parsed.get("stress_level", 3.0)))), 3)
        emotion_confidence = round(max(0.0, min(1.0, float(parsed.get("emotion_confidence", 0.6)))), 3)
        analysis_confidence = round(max(0.0, min(1.0, float(parsed.get("analysis_confidence", 0.65)))), 3)
        sentiment_label = str(parsed.get("sentiment_label", "neutral")).lower()
        emotion_group = str(parsed.get("emotion_group", "neutral")).lower()
        emotion = str(parsed.get("emotion", "neutral")).lower()
        insights = [
            str(item).strip()
            for item in (parsed.get("insights", []) or [])
            if str(item).strip()
        ][:3]

        if sentiment_label not in {"positive", "neutral", "negative"}:
            sentiment_label = "positive" if sentiment_score >= 6.2 else "negative" if sentiment_score <= 4.2 else "neutral"
        if emotion_group not in {"positive", "neutral", "negative"}:
            emotion_group = sentiment_label
        if not emotions_detected:
            emotions_detected = [[emotion, emotion_confidence]]
        if not insights:
            insights = self._get_fallback_insights(
                {"label": sentiment_label, "score": sentiment_score, "confidence": analysis_confidence},
                {"primary_emotion": emotion, "emotion_group": emotion_group},
            )

        return {
            "sentiment_score": sentiment_score,
            "sentiment_label": sentiment_label,
            "emotion": emotion,
            "emotion_confidence": emotion_confidence,
            "emotions_detected": emotions_detected,
            "emotion_group": emotion_group,
            "stress_level": stress_level,
            "insights": insights,
            "embeddings": None,
            "analysis_confidence": analysis_confidence,
        }

    def _count_weighted_cues(self, text: str, cues: Dict[str, float]) -> float:
        text_lower = text.lower()
        return sum(weight for phrase, weight in cues.items() if phrase in text_lower)

    def _refine_sentiment_with_context(
        self, text: str, sentiment_result: Dict, emotion_result: Dict
    ) -> Dict:
        score = float(sentiment_result.get("score", 5.0))
        confidence = float(sentiment_result.get("confidence", 0.5))
        emotions = emotion_result.get("all_emotions", []) or []

        positive_bias = self._count_weighted_cues(text, self.positive_cues)
        negative_bias = self._count_weighted_cues(text, self.negative_cues)

        emotion_bias = 0.0
        for emotion, raw_score in emotions[:3]:
            emotion_bias += self.emotion_valence.get(str(emotion).lower(), 0.0) * float(raw_score)

        adjusted_score = score + positive_bias - negative_bias + emotion_bias
        adjusted_score = max(0.0, min(10.0, adjusted_score))

        if adjusted_score >= 6.2:
            label = "positive"
        elif adjusted_score <= 4.2:
            label = "negative"
        else:
            label = "neutral"

        adjusted_confidence = min(
            0.98, max(confidence, 0.55 + abs(adjusted_score - 5.0) * 0.08)
        )

        return {
            "label": label,
            "score": round(adjusted_score, 3),
            "confidence": round(adjusted_confidence, 3),
        }
    
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
            insights.append("There is a clear lift in your writing that feels grounded and genuine.")
            insights.append("Notice what helped you feel steadier or more encouraged today.")
        elif sentiment == 'negative':
            insights.append("Your entry carries real strain, and that honesty is worth paying attention to.")
            insights.append("Consider the specific moment, thought, or pressure point that felt heaviest.")
        else:
            insights.append("Your reflection feels more mixed or balanced than strongly positive or negative.")
            insights.append("Look for the detail that mattered most emotionally, even if the day felt ordinary.")
        
        if emotion in ('joy', 'gratitude', 'relief', 'optimism'):
            insights.append("There is a warm, restorative tone here that may be worth recreating intentionally.")
        elif emotion in ('sadness', 'grief', 'remorse'):
            insights.append("This reads like a tender or heavier emotional moment that may need gentleness, not fixing.")
        elif emotion in ('anger', 'annoyance', 'disappointment'):
            insights.append("The frustration in this entry suggests something meaningful may feel blocked or unresolved.")
        elif emotion in ('fear', 'nervousness'):
            insights.append("The tension here sounds anticipatory, like your mind is bracing for what comes next.")
        
        return insights[:3]
    
    def _calculate_stress_level(self, text: str, sentiment_result: Dict, emotion_result: Dict) -> float:
        """Calculate stress level based on analysis results and return 0-10 scale"""
        try:
            score = float(sentiment_result.get("score", 5.0))
            emotions = emotion_result.get("all_emotions", []) or []

            base_stress = max(0.0, 5.5 - score) * 0.9
            emotion_stress = 0.0
            for emotion, raw_score in emotions[:3]:
                emotion_stress += self.stress_weights.get(str(emotion).lower(), 0.0) * float(raw_score)

            keyword_stress = self._count_weighted_cues(text, self.negative_cues) * 1.35
            calming_offset = self._count_weighted_cues(text, self.positive_cues) * 0.9

            total_stress = base_stress + emotion_stress + keyword_stress - calming_offset
            total_stress = max(0.8, min(10.0, total_stress))
            return round(total_stress, 1)
            
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
