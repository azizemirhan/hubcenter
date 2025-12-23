#!/bin/bash
echo "Starting development environment..."

cd ../backend
source venv/bin/activate
python manage.py runserver &

celery -A config worker -l info &
celery -A config beat -l info &

cd ../frontend
npm run dev &

echo "Services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
