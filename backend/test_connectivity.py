import os
from dotenv import load_dotenv
from groq import Groq
import google.generativeai as genai

load_dotenv()

def test_groq():
    print("Testing Groq...")
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say 'Groq is Online'"}],
            model="llama-3.3-70b-versatile",
        )
        print(f"Groq 70B: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"Groq 70B Error: {e}")

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say 'Groq 8B is Online'"}],
            model="llama-3.1-8b-instant",
        )
        print(f"Groq 8B: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"Groq 8B Error: {e}")

def test_gemini():
    print("\nTesting Gemini...")
    genai.configure(api_key=os.getenv("GEMMA_API_KEY"))
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content("Say 'Gemini 2.0 is Online'")
        print(f"Gemini 2.0: {response.text}")
    except Exception as e:
        print(f"Gemini 2.0 Error: {e}")
        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content("Say 'Gemini Latest is Online'")
            print(f"Gemini Latest: {response.text}")
        except Exception as e2:
            print(f"Gemini Latest Error: {e2}")

if __name__ == "__main__":
    test_groq()
    test_gemini()
