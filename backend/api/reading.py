from flask import Blueprint, request, jsonify
import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Load environment variables from .env file in backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)
from models.walking_window import WalkingWindow
from models.word import Word
from utils import settings
from api.study import sessions, word_to_dict

bp = Blueprint('reading', __name__, url_prefix='/api/reading')

# Try to import Gemini API (will fail gracefully if not installed)
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None

# Initialize Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY and GENAI_AVAILABLE:
    genai.configure(api_key=GEMINI_API_KEY)

def build_words_list(current_words):
    """Build a formatted string of words with their translations for the prompt."""
    if not current_words:
        return ""
    
    word_list = []
    for word in current_words:
        word_list.append(f"{word['foreign']} ({word['english']})")
    
    return ", ".join(word_list)

def get_language_name_for_prompt(language):
    """Map language setting to proper language name for prompts."""
    language_map = {
        'Spanish': 'Spanish',
        'French': 'French',
        'Arabic': 'Arabic',
        'Japanese': 'Japanese',
        'Mandarin': 'Mandarin',
        'Hieroglyphic': 'Ancient Egyptian Hieroglyphic'
    }
    return language_map.get(language, language)

@bp.route('/short-story', methods=['POST'])
def generate_short_story():
    """
    Generate a short story in the target language using words from the walking window.
    """
    if not GENAI_AVAILABLE:
        return jsonify({'error': 'Google Generative AI package not installed. Please install: pip install google-generativeai'}), 500
    
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 500
    
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    current_words = [word_to_dict(w) for w in walking_window.current_words]
    
    if not current_words:
        return jsonify({'error': 'No words in walking window'}), 400
    
    language = settings.LANGUAGE
    language_name = get_language_name_for_prompt(language)
    words_list = build_words_list(current_words)
    
    prompt = f"""Generate a short story in {language_name} that naturally incorporates these words: {words_list}.

Requirements:
- Write the entire story in {language_name} only
- Use the words naturally in context (do not list them separately)
- Make the story engaging and interesting
- Let the story length be appropriate for reading practice"""

    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        story_text = response.text.strip()
        
        return jsonify({
            'success': True,
            'text': story_text,
            'words': current_words
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate story: {str(e)}'}), 500

@bp.route('/topical-passage', methods=['POST'])
def generate_topical_passage():
    """
    Generate a topical passage in the target language using words from the walking window.
    """
    if not GENAI_AVAILABLE:
        return jsonify({'error': 'Google Generative AI package not installed. Please install: pip install google-generativeai'}), 500
    
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 500
    
    data = request.json
    session_id = data.get('session_id')
    topic = data.get('topic', '').strip()
    
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    current_words = [word_to_dict(w) for w in walking_window.current_words]
    
    if not current_words:
        return jsonify({'error': 'No words in walking window'}), 400
    
    language = settings.LANGUAGE
    language_name = get_language_name_for_prompt(language)
    words_list = build_words_list(current_words)
    
    prompt = f"""Write a passage in {language_name} about {topic}. 

Requirements:
- Write the entire passage in {language_name} only
- Naturally incorporate these words that the reader is learning: {words_list}
- The passage should be informative about the topic
- Use the words in context (do not list them separately)
- Let the passage length be appropriate for reading practice"""

    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        passage_text = response.text.strip()
        
        return jsonify({
            'success': True,
            'text': passage_text,
            'words': current_words
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate passage: {str(e)}'}), 500

