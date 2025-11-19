from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Import API routes
from api import auth, words, study, stats, settings_api, reading, classrooms, classroom_stats

# Register blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(words.bp)
app.register_blueprint(study.bp)
app.register_blueprint(stats.bp)
app.register_blueprint(settings_api.bp)
app.register_blueprint(reading.bp)
app.register_blueprint(classrooms.bp)
app.register_blueprint(classroom_stats.bp)

if __name__ == '__main__':
    # Ensure directories exist
    os.makedirs('UserWords', exist_ok=True)
    os.makedirs('audio_files', exist_ok=True)
    app.run(debug=True, port=5000)

