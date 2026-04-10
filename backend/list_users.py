from components.connection import connection

db = connection()
res = db.table("profiles").select("email, role").execute()
if res.data:
    for profile in res.data:
        print(f"User: {profile['email']}, Role: {profile['role']}")
else:
    print("No users found in profiles table.")
