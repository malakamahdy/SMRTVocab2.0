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
    assignment_id = data.get('assignment_id')  # Optional: for assignment mode
    
    settings.username = username
    settings.LANGUAGE = language
    
    if assignment_id:
        # Assignment mode
        session_id = f"{username}_{language}_assignment_{assignment_id}"
        sessions[session_id] = WalkingWindow(
            size=settings.WALKING_WINDOW_SIZE,
            assignment_id=assignment_id,
            student_email=username
        )
    else:
        # Normal mode
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
    
    if not session_id:
        return jsonify({'error': 'Session ID is required'}), 400
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    if not flashword_data:
        return jsonify({'error': 'Flashword is required'}), 400
    
    if not answer:
        return jsonify({'error': 'Answer is required'}), 400
    
    try:
        walking_window = sessions[session_id]
        
        # Get the foreign word from flashword_data
        # flashword_data should be a dict with 'foreign' and 'english' keys
        if not isinstance(flashword_data, dict):
            return jsonify({'error': 'Flashword must be an object with foreign and english properties'}), 400
        
        foreign_word = flashword_data.get('foreign')
        
        if not foreign_word:
            return jsonify({'error': 'Flashword foreign text is required'}), 400
        
        flashword = walking_window.words_dict.get(foreign_word)
        
        if not flashword:
            # Log available words for debugging
            available_words = list(walking_window.words_dict.keys())[:10]  # First 10 for debugging
            import logging
            logging.warning(f"Word '{foreign_word}' not found. Available words (sample): {available_words}")
            return jsonify({'error': f'Word "{foreign_word}" not found in word list'}), 404
        
        # Check the answer - answer should be a string (the English translation)
        if not isinstance(answer, str):
            answer = str(answer)
        
        is_correct = walking_window.check_word_definition(flashword, answer)
        
        # Auto-save after each answer to persist word statistics
        # Extract username from session_id (format: username_language or username_language_assignment_id)
        username = session_id.split('_')[0] if '_' in session_id else settings.username
        csv_name = f"{username}_{settings.LANGUAGE}.csv"
        walking_window.word_dict_to_csv(csv_name)
        
        return jsonify({
            'correct': is_correct,
            'word': word_to_dict(flashword)
        })
    except Exception as e:
        import logging
        logging.error(f"Error in check_answer: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error processing answer: {str(e)}'}), 500

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
        # Auto-save after marking as known (handles both assignment and personal modes)
        username = session_id.split('_')[0] if '_' in session_id else settings.username
        csv_name = f"{username}_{settings.LANGUAGE}.csv"
        walking_window.word_dict_to_csv(csv_name)
    
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

@bp.route('/get-current-words', methods=['POST'])
def get_current_words():
    """
    Get all words currently in the walking window (words being actively learned).
    """
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    current_words = [word_to_dict(w) for w in walking_window.current_words]
    
    return jsonify({'words': current_words})

@bp.route('/check-review-answer', methods=['POST'])
def check_review_answer():
    """
    Check answer for review mode (known words).
    This updates word statistics but doesn't affect the walking window.
    """
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
    
    # Check answer and update statistics (but don't move words in walking window)
    is_correct = flashword.check_definition(answer)
    
    # Auto-save after each review answer to persist word statistics
    username = session_id.split('_')[0] if '_' in session_id else settings.username
    csv_name = f"{username}_{settings.LANGUAGE}.csv"
    walking_window.word_dict_to_csv(csv_name)
    
    return jsonify({
        'correct': is_correct,
        'word': word_to_dict(flashword)
    })

