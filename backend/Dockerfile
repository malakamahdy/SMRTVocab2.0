FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio and image processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p UserWords audio_files

# Verify template CSV files are present (they should be copied from COPY . .)
RUN ls -la UserWords/Template_*.csv 2>/dev/null || (echo "ERROR: Template CSV files not found!" && exit 1)

# Set environment variables
ENV PORT=8080
ENV FLASK_ENV=production

# Expose port
EXPOSE 8080

# Use gunicorn to run the Flask app
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app

