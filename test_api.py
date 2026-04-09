import requests
import json

BASE_URL = "http://localhost:8001"

def test_endpoint(name, path, payload):
    print(f"Testing {name}...")
    try:
        response = requests.post(f"{BASE_URL}{path}", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("-" * 30)
    except Exception as e:
        print(f"FAILED {name}: {e}")

if __name__ == "__main__":
    # 1. Test Chat (RAG)
    test_endpoint("AI Chat (RAG)", "/api/chat", {"query": "Tell me about the importance of Python in AI."})

    # 2. Test Risk Prediction (ML)
    test_endpoint("Risk Prediction", "/api/predict-risk", {"metrics": [8.0, 0.95, 80, 90]})

    # 3. Test Wellbeing Analysis
    test_endpoint("Wellbeing Analysis", "/api/wellbeing-risk", {"feedback": "I'm feeling very stressed and overwhelmed with the curriculum."})

    # 4. Test Support Recommendations
    test_endpoint("Support Recommendations", "/api/support-recommendations", {
        "risk_level": "High",
        "scores": {"Math": 50, "Science": 60}
    })

    # 5. Test Course Generation (YouTube)
    test_endpoint("Course Generation", "/api/generate-course", {"topic": "Next.js 14 Tutorial", "no_of_chapters": 3})
