from flask import Blueprint, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from models.walking_window import WalkingWindow
from models.word import Word
from utils import settings

bp = Blueprint('study', __name__, url_prefix='/api/study')

# Store active sessions (in production, use Redis or database)
sessions = {}

def word_to_dict(word):
    return {
        'foreign': word.foreign,
        'english': word.english,
        'count_seen': word.count_seen,
        'count_correct': word.count_correct,
        'count_incorrect': word.count_incorrect,
        'is_known': word.is_known
    }

@bp.route('/init', methods=['POST'])
def init_study():
    data = request.json
    username = data.get('username')
    language = data.get('language', settings.LANGUAGE)
    
    settings.username = username
    settings.LANGUAGE = language
    
    session_id = f"{username}_{language}"
    sessions[session_id] = WalkingWindow(size=settings.WALKING_WINDOW_SIZE)
    
    return jsonify({'success': True, 'session_id': session_id})

@bp.route('/random-words', methods=['POST'])
def get_random_words():
    data = request.json
    session_id = data.get('session_id')
    count = data.get('count', 1)
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    words = sessions[session_id].get_random_words(count)
    return jsonify({'words': [word_to_dict(w) for w in words]})

@bp.route('/check-answer', methods=['POST'])
def check_answer():
    data = request.json
    session_id = data.get('session_id')
    flashword_data = data.get('flashword')
    answer = data.get('answer')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    flashword = walking_window.words_dict.get(flashword_data['foreign'])
    
    if not flashword:
        return jsonify({'error': 'Word not found'}), 404
    
    is_correct = walking_window.check_word_definition(flashword, answer)
    
    return jsonify({
        'correct': is_correct,
        'word': word_to_dict(flashword)
    })

@bp.route('/mark-known', methods=['POST'])
def mark_known():
    data = request.json
    session_id = data.get('session_id')
    flashword_data = data.get('flashword')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    flashword = walking_window.words_dict.get(flashword_data['foreign'])
    
    if flashword:
        walking_window.mark_word_as_known(flashword)
    
    return jsonify({'success': True})

@bp.route('/save', methods=['POST'])
def save_session():
    data = request.json
    session_id = data.get('session_id')
    username = data.get('username')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    csv_name = f"{username}_{settings.LANGUAGE}.csv"
    walking_window.word_dict_to_csv(csv_name)
    
    return jsonify({'success': True})

@bp.route('/get-known-words', methods=['POST'])
def get_known_words():
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    known_words = [word_to_dict(w) for w in walking_window.words_dict.values() if w.is_known]
    
    return jsonify({'words': known_words})

