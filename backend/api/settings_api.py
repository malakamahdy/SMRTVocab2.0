from flask import Blueprint, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import settings
from models.walking_window import WalkingWindow

bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@bp.route('/get', methods=['GET'])
def get_settings():
    return jsonify({
        'known_threshold': settings.KNOWN_THRESHOLD,
        'known_delta': settings.KNOWN_DELTA,
        'srs_queue_length': settings.SRS_QUEUE_LENGTH,
        'walking_window_size': settings.WALKING_WINDOW_SIZE,
        'foreign_to_english': settings.FOREIGN_TO_ENGLISH,
        'language': settings.LANGUAGE,
        'auto_tts': settings.AUTO_TTS,
        'volume': settings.VOLUME,
        'language_options': settings.LANGUAGE_OPTIONS,
        'known_threshold_min': settings.KNOWN_THRESHOLD_MIN,
        'known_threshold_max': settings.KNOWN_THRESHOLD_MAX,
        'known_delta_min': settings.KNOWN_DELTA_MIN,
        'known_delta_max': settings.KNOWN_DELTA_MAX,
        'srs_queue_length_min': settings.SRS_QUEUE_LENGTH_MIN,
        'srs_queue_length_max': settings.SRS_QUEUE_LENGTH_MAX,
        'walking_window_size_min': settings.WALKING_WINDOW_SIZE_MIN,
        'walking_window_size_max': settings.WALKING_WINDOW_SIZE_MAX
    })

@bp.route('/update', methods=['POST'])
def update_settings():
    data = request.json
    session_id = data.get('session_id')
    
    from api.study import sessions
    
    # Save current session if exists
    if session_id and session_id in sessions:
        username = session_id.split('_')[0]
        sessions[session_id].word_dict_to_csv(f"{username}_{settings.LANGUAGE}.csv")
    
    # Update settings
    settings.KNOWN_THRESHOLD = data.get('known_threshold', settings.KNOWN_THRESHOLD)
    settings.KNOWN_DELTA = data.get('known_delta', settings.KNOWN_DELTA)
    settings.SRS_QUEUE_LENGTH = data.get('srs_queue_length', settings.SRS_QUEUE_LENGTH)
    settings.WALKING_WINDOW_SIZE = data.get('walking_window_size', settings.WALKING_WINDOW_SIZE)
    settings.FOREIGN_TO_ENGLISH = data.get('foreign_to_english', settings.FOREIGN_TO_ENGLISH)
    settings.LANGUAGE = data.get('language', settings.LANGUAGE)
    settings.AUTO_TTS = data.get('auto_tts', settings.AUTO_TTS)
    settings.VOLUME = data.get('volume', settings.VOLUME)
    
    # Recreate session with new settings
    if session_id:
        username = session_id.split('_')[0]
        new_session_id = f"{username}_{settings.LANGUAGE}"
        sessions[new_session_id] = WalkingWindow(size=settings.WALKING_WINDOW_SIZE)
        
        return jsonify({
            'success': True,
            'session_id': new_session_id
        })
    
    return jsonify({'success': True})

