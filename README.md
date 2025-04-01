# Task Manager with Authentication

A full-stack task management application built with Flask and vanilla JavaScript, featuring secure user authentication and real-time task management capabilities.

## Features

- 🔐 Secure JWT-based authentication
- 👤 User registration and login
- ✅ Create, read, update, and delete tasks
- 🔍 Filter tasks by status (All, Active, Completed)
- 📱 Responsive design for all devices
- 🔔 Interactive notifications

## Tech Stack

- **Backend**: Flask, SQLite, JWT
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Authentication**: Flask-JWT-Extended
- **Database**: SQLite3

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with:
```
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
```

4. Run the application:
```bash
python app.py
```

The server will start at `http://localhost:5002`

## Project Structure

- `/static` - Frontend assets (CSS, JavaScript)
- `/templates` - HTML templates
- `/docs` - Documentation files
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies

## License

© 2025 Task Manager. All rights reserved.
