from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)

# Configure CORS - allow Firebase Hosting domain and localhost for development
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

# Import API routes
from api import auth, words, study, stats, settings_api, reading, classrooms, classroom_stats, classroom_assignments

# Register blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(words.bp)
app.register_blueprint(study.bp)
app.register_blueprint(stats.bp)
app.register_blueprint(settings_api.bp)
app.register_blueprint(reading.bp)
app.register_blueprint(classrooms.bp)
app.register_blueprint(classroom_stats.bp)
app.register_blueprint(classroom_assignments.bp)

# Ensure directories exist on startup (for both local and Cloud Run)
os.makedirs('UserWords', exist_ok=True)
os.makedirs('audio_files', exist_ok=True)

# Create language-specific audio directories
for lang in ['english', 'spanish', 'french', 'arabic', 'japanese', 'mandarin', 'tokipona']:
    os.makedirs(f'audio_files/{lang}', exist_ok=True)

if __name__ == '__main__':
    # Get port from environment variable (Cloud Run sets PORT)
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    # Run on 0.0.0.0 to accept connections from outside container
    app.run(host='0.0.0.0', port=port, debug=debug)

