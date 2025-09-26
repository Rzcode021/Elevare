# Backend (Django) - Quick Start (Hackathon)

This guide helps you run the Django backend locally for hackathon/demo purposes.

Prerequisites
- Python 3.11+ installed and on PATH
- (Optional) PostgreSQL if you want to connect to a remote DB; otherwise the default quick path uses SQLite

Quick steps (PowerShell)

1) Open PowerShell and go to this folder:

```powershell
cd C:\Users\khanr\OneDrive\Desktop\hackathonproject\backend\backend
```

2) Create and activate a virtual environment

```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
```

3) Install dependencies

```powershell
pip install --upgrade pip
pip install -r ..\requirements.txt
```

4) Use SQLite for quick local development. Edit `.env` (already present) and set:

```
DATABASE_URL=sqlite:///./db.sqlite3
SECRET_KEY=dev-secret-key
DEBUG=True
```

5) Run migrations and create a superuser

```powershell
python manage.py migrate
python manage.py createsuperuser
```

6) Run the server

```powershell
python manage.py runserver 0.0.0.0:8000
```

7) Test the demo assessment endpoint (no auth required in DEBUG mode):

```powershell
$body = '{"initial_profile": {"name":"Test","age":20}}'
curl -X POST http://127.0.0.1:8000/api/assessments/create/ -H "Content-Type: application/json" -d $body
```

8) Submit completed assessment answers to receive analysis/recommendations:

```powershell
# Suppose the create response returned {"assessment_id": 5, "questions": [...]}
$answers = '{"1":"4","2":"Coding","3":"5"}'
curl -X POST http://127.0.0.1:8000/api/assessments/5/submit/ -H "Content-Type: application/json" -d $answers
```

Frontend integration notes
- After creating an assessment, the backend returns { assessment_id, questions }.
- The frontend should POST the answers as a JSON object where keys are question IDs (strings or numbers) and values are the selected answer.
- The submit endpoint returns: { assessment_id, category_scores, recommendations, explanation }.

Notes
- `CreateAssessmentView` will use sample questions when the n8n webhook is not configured. This keeps the demo self-contained.
- For production, revert `permission_classes` to require authentication and provide a real N8N webhook or AI service.

N8N webhook (LLM) integration
- To use n8n for AI-generated assessments, set the `N8N_ASSESSMENT_WEBHOOK_URL` environment variable in your `.env` to the n8n webhook address. The backend will POST the user's `initial_profile` along with `num_questions`, `min_questions`, and `max_questions`.
- The n8n workflow should call an LLM (e.g., Gemini) and return JSON array of questions where each item includes at least `questionText`, `options` (array) and optionally `correctAnswer` and `category`.
- Example `.env` line:

```
N8N_ASSESSMENT_WEBHOOK_URL=https://your-n8n.example/webhook/your-workflow
```

If you want, I can:
- Run these steps here and start the dev server for you
- Provide a docker-compose setup with Postgres + Django
- Wire the frontend to this backend with a small proxy config
