from flask import Flask, render_template, request, redirect
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Supabase connection
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

@app.route('/')
def index():
    return render_template('feedback.html')

@app.route('/feedback', methods=['POST'])
def feedback():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        message = request.form['message']

        # Insert the feedback into Supabase
        try:
            supabase.table("feedback").insert({
                "name": name,
                "email": email,
                "message": message
            }).execute()
        except Exception as e:
            print(f"Feedback error: {e}")

        # After submission, render the thank you page
        return render_template('thankyou.html')
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True, port=int(os.getenv("FEEDBACK_PORT", 5000)))
