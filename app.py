from flask import Flask, request, jsonify, g, render_template, redirect, url_for, flash, session
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import sqlite3
import os
from dotenv import load_dotenv

app = Flask(__name__, template_folder="templates", static_folder="static")

# Enable CORS for API routes only
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Setup JWT and Secret Keys
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=1)
jwt = JWTManager(app)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'app.db')

def get_db():
    """Create a new database connection if one doesn't exist."""
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    """Close the database connection at the end of the request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize the database with tables if they don't exist."""
    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
        user_email TEXT NOT NULL,
        FOREIGN KEY (user_email) REFERENCES users (email)
    )
    ''')

    db.commit()

# Initialize database
with app.app_context():
    init_db()

# 🔹 Serve HTML pages using `render_template`
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    if "token" not in session:
        flash("You need to log in first", "error")
        return redirect(url_for("login"))

    return render_template("dashboard.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

# 🔹 Authentication Routes
@app.route("/api/register", methods=["POST"])
def register():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    email = request.json.get("email")
    password = request.json.get("password")
    name = request.json.get("name")

    if not email or not password or not name:
        return jsonify({"error": "All fields are required"}), 400

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT email FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        return jsonify({"error": "Email already exists"}), 400

    cursor.execute(
        "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
        (email, generate_password_hash(password), name)
    )
    db.commit()

    # ✅ Return JSON with a redirect URL
    return jsonify({
        "message": "Registration successful! Redirecting to login...",
        "redirect_url": url_for("login")
    }), 201
  # Redirect to login WITHOUT parameters

@app.route("/api/login", methods=["POST"])
def login_user():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    email = request.json.get("email")
    password = request.json.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Create the JWT token
    access_token = create_access_token(identity=email)

    # Store the token in Flask session
    session["token"] = access_token
    session["user_name"] = user["name"]

    # Send JSON response with redirect URL for frontend handling
    return jsonify({
        "access_token": access_token,
        "user_name": user["name"],
        "redirect_url": url_for("dashboard")  # Returns '/dashboard'
    }), 200

@app.route("/api/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def profile():
    current_user = get_jwt_identity()

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT email, name FROM users WHERE email = ?", (current_user,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(dict(user)), 200

# 🔹 Task Management Routes
@app.route("/api/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    current_user = get_jwt_identity()

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "SELECT id, title, completed FROM tasks WHERE user_email = ? ORDER BY id DESC",
        (current_user,)
    )
    tasks = [dict(row) for row in cursor.fetchall()]

    return jsonify(tasks), 200

@app.route("/api/tasks", methods=["POST"])
@jwt_required()
def add_task():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    title = request.json.get("title")
    if not title:
        return jsonify({"error": "Task title is required"}), 400

    current_user = get_jwt_identity()
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "INSERT INTO tasks (title, completed, user_email) VALUES (?, ?, ?)",
        (title, False, current_user)
    )
    task_id = cursor.lastrowid
    db.commit()

    return jsonify({"id": task_id, "title": title, "completed": False}), 201

@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    completed = request.json.get("completed")
    if completed is None:
        return jsonify({"error": "Completed status is required"}), 400

    current_user = get_jwt_identity()
    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM tasks WHERE id = ? AND user_email = ?", (task_id, current_user))
    task = cursor.fetchone()

    if not task:
        return jsonify({"error": "Task not found"}), 404

    cursor.execute("UPDATE tasks SET completed = ? WHERE id = ?", (completed, task_id))
    db.commit()

    return jsonify({"message": "Task updated successfully"}), 200

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    current_user = get_jwt_identity()

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM tasks WHERE id = ? AND user_email = ?", (task_id, current_user))
    task = cursor.fetchone()

    if not task:
        return jsonify({"error": "Task not found"}), 404

    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    db.commit()

    return jsonify({"message": "Task deleted successfully"}), 200

if __name__ == "__main__":
    app.run(port=5002, debug=True)