#Angad Dhawan
# Python base image (slim = small)
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer for faster rebuilds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code + the JSON data files it loads at startup
COPY . .

# Documents the port; the real one comes from the PORT env var
EXPOSE 10000

# Production server (gunicorn). Shell form so ${PORT} expands at runtime.
# "app:app" = in app.py, run the variable named "app".
# --workers 1 because your app holds timetable data in globals and rewrites
# JSON on /upload, so multiple workers would go out of sync.
# --timeout 120 because processing an uploaded Excel can be slow.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-3001} --workers 1 --timeout 120 app:app"]