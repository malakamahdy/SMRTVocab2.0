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
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None

# Initialize Gemini API client
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = None
if GEMINI_API_KEY and GENAI_AVAILABLE:
    # Client automatically gets API key from GEMINI_API_KEY environment variable
    client = genai.Client()

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
        return jsonify({'error': 'Google Generative AI package not installed. Please install: pip install google-genai'}), 500
    
    if not client:
        return jsonify({'error': 'Gemini API key not configured or client not initialized'}), 500
    
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
    
    # Simplified, concise prompt for faster generation
    prompt = f"""Write a 2-3 paragraph story in {language_name} using these words: {words_list}. Keep it short and engaging."""

    try:
        # Prioritize fastest flash models first
        model_names = ['gemini-1.5-flash', 'gemini-2.5-flash']
        response = None
        last_error = None
        
        for model_name in model_names:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                break
            except Exception as e:
                last_error = e
                continue
        
        if response is None:
            raise Exception(f"Could not find a working model. Last error: {str(last_error)}")
        
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
        return jsonify({'error': 'Google Generative AI package not installed. Please install: pip install google-genai'}), 500
    
    if not client:
        return jsonify({'error': 'Gemini API key not configured or client not initialized'}), 500
    
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
    
    # Simplified prompt - web search will happen automatically if available, but don't wait for extensive research
    prompt = f"""Write a 2-3 paragraph passage in {language_name} about {topic}. Use accurate information and include these words: {words_list}. Keep it concise."""

    try:
        # Prioritize fastest flash models first
        model_names = ['gemini-1.5-flash', 'gemini-2.5-flash']
        response = None
        last_error = None
        
        for model_name in model_names:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                break
            except Exception as e:
                last_error = e
                continue
        
        if response is None:
            raise Exception(f"Could not find a working model. Last error: {str(last_error)}")
        
        passage_text = response.text.strip()
        
        return jsonify({
            'success': True,
            'text': passage_text,
            'words': current_words
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate passage: {str(e)}'}), 500

