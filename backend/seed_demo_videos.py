import requests
import time

# 5 Short, highly educational videos for the demo
videos = [
    {
        "url": "https://www.youtube.com/watch?v=R2rsJkE5E3g", 
        "tutor_name": "Veritasium", 
        "course_name": "Physics & Reality"
    },
    {
        "url": "https://www.youtube.com/watch?v=ZhpmMEp1DfI", 
        "tutor_name": "3Blue1Brown", 
        "course_name": "Deep Learning"
    },
    {
        "url": "https://www.youtube.com/watch?v=tT8H30R4Pik", 
        "tutor_name": "Oversimplified", 
        "course_name": "World History"
    },
    {
        "url": "https://www.youtube.com/watch?v=2eWuYf-aZE4", 
        "tutor_name": "Andrej Karpathy", 
        "course_name": "Large Language Models"
    },
    {
        "url": "https://www.youtube.com/watch?v=F0NjdI_2cbw", 
        "tutor_name": "Kurzgesagt", 
        "course_name": "Space & Universe"
    }
]

print("Starting Automated Knowledge Injection...")
for idx, v in enumerate(videos):
    print(f"\n[{idx+1}/5] Processing {v['course_name']} - {v['url']}...")
    try:
        res = requests.post(
            "http://localhost:8001/api/process-video", 
            json={"video_url": v["url"], "tutor_name": v["tutor_name"], "course_name": v["course_name"]},
            timeout=600 # Long timeout since whisper takes time
        )
        if res.status_code == 200:
            print(f"SUCCESS: Mapped {res.json()['chunks_processed']} semantic chunks.")
        else:
            print(f"FAILED: {res.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    time.sleep(2)

print("\nAll videos have been injected into the Vector space!")
