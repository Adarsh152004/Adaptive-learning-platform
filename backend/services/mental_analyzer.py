from typing import List, Dict, Any
import datetime

class MentalStateAnalyzer:
    @staticmethod
    def calculate_mood_score(mood_logs: List[Dict[str, Any]]) -> float:
        if not mood_logs:
            return 3.0  # Neutral baseline
        
        # Simple average of the last 7 entries
        recent_moods = [log['mood'] for log in mood_logs[-7:]]
        return sum(recent_moods) / len(recent_moods)

    @staticmethod
    def calculate_engagement_score(activity_logs: List[Dict[str, Any]]) -> float:
        if not activity_logs:
            return 0.0
        
        # Logic: Frequency of logins and total duration in the last 7 days
        # Max score 100
        now = datetime.datetime.now(datetime.timezone.utc)
        one_week_ago = now - datetime.timedelta(days=7)
        
        recent_activities = [
            log for log in activity_logs 
            if datetime.datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')) > one_week_ago
        ]
        
        total_duration = sum(log.get('duration', 0) for log in recent_activities)
        unique_days = len(set(datetime.datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date() for log in recent_activities))
        
        # Example Calculation: (unique_days * 10) + (total_duration / 60)
        engagement = (unique_days * 12) + (total_duration / 30)
        return min(100.0, max(0.0, engagement))

    @staticmethod
    def calculate_cognitive_score(game_results: List[Dict[str, Any]]) -> float:
        if not game_results:
            return 50.0 # Baseline
        
        # Reaction time and Memory accuracy
        # Lower reaction time is better, higher accuracy is better
        recent_results = game_results[-10:]
        
        avg_score = sum(log['score'] for log in recent_results) / len(recent_results)
        # Normalize score (assuming 0-100)
        return min(100.0, max(0.0, avg_score))

    @classmethod
    def analyze_mental_state(cls, mood_score: float, engagement_score: float, cognitive_score: float) -> Dict[str, Any]:
        state = "Healthy"
        confidence = 0.85
        reason = "All metrics are within stable ranges."

        if mood_score < 2.0 and engagement_score < 40.0:
            state = "High Risk"
            reason = "Consistently low mood and very low engagement detected. High risk of burnout or stress."
        elif mood_score < 3.0 or engagement_score < 50.0:
            state = "Mild Stress"
            reason = "Mood or engagement levels are lower than usual. Monitor closely."
        
        if cognitive_score < 40.0:
            reason += " Significant drop in cognitive performance detected, possibly due to fatigue."
            if state == "Healthy":
                state = "Mild Stress"

        return {
            "mental_state": state,
            "confidence_score": confidence,
            "reason": reason,
            "scores": {
                "mood": round(mood_score, 2),
                "engagement": round(engagement_score, 2),
                "cognitive": round(cognitive_score, 2),
                "mental_health_score": round((mood_score * 20 + engagement_score + cognitive_score) / 3, 2)
            }
        }
