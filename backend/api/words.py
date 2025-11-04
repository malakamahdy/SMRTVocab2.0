from flask import Blueprint, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import text_to_speech

bp = Blueprint('words', __name__, url_prefix='/api/words')

@bp.route('/tts', methods=['POST'])
def get_tts():
    data = request.json
    word = data.get('word')
    language = data.get('language', 'spanish')
    
    # Map language names to lowercase for TTS
    lang_map = {
        'Spanish': 'spanish',
        'French': 'french',
        'Arabic': 'arabic',
        'Japanese': 'japanese',
        'Mandarin': 'mandarin',
        'Hieroglyphic': 'english'  # Fallback for hieroglyphic
    }
    lang = lang_map.get(language, language.lower())
    
    audio_path = text_to_speech.generate_pronunciation(word, lang)
    
    if audio_path:
        return jsonify({
            'success': True,
            'audio_path': audio_path
        })
    
    return jsonify({'error': 'Failed to generate pronunciation'}), 400

