from flask import Flask, jsonify, request, session, redirect, url_for, Blueprint, current_app
from werkzeug.security import generate_password_hash as gen, check_password_hash as check
from .connection import connection
import jwt
import datetime
import os
from functools import wraps

auth_routes = Blueprint('auth', __name__)

# DB connection
db = connection()
users = db["users"]

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, os.getenv("JWT_SECRET", "secret"), algorithms=["HS256"])
            current_user = users.find_one({"email": data['email']})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Registration route
@auth_routes.route("/register", methods=['POST'])
@auth_routes.route("/signup", methods=['POST'])
def register():
    data = request.json
    name = data.get("name")
    age = data.get('age')
    email = data.get('email')
    password = data.get('password')
    hash_pass = gen(password)
    existing_user = users.find_one({"email": email})
    
    if existing_user:
        return jsonify({"existsmessage": "User already exists"}), 400
    
    new_user = {
        'name': name,
        'age': age,
        'email': email,
        'pass': hash_pass,
        'created_at': datetime.datetime.utcnow()
    }
    users.insert_one(new_user)
    return jsonify({"message": "User registered successfully"}), 201

# Login route
@auth_routes.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    existing_user = users.find_one({"email": email})
    
    if existing_user and check(existing_user['pass'], password):
        session['email'] = email
        session['logged_in'] = True
        
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, os.getenv("JWT_SECRET", "secret"), algorithm="HS256")
        
        return jsonify({
            'message': "Login Successful",
            'token': token
        }), 200
        
    return jsonify({"invalidmessage": "Invalid email or password"}), 401

# Logout route
@auth_routes.route("/logout", methods=['POST', 'GET'])
def logout():
    session.clear()
    return redirect(url_for("authentication"))

