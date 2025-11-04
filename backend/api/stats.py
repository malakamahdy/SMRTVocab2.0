from flask import Blueprint, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import settings

bp = Blueprint('stats', __name__, url_prefix='/api/stats')

def count_known_words(words_dict):
    return sum(1 for w in words_dict.values() if w.is_known)

def determine_most_incorrect(words_dict):
    num_incorrect = 0
    most_incorrect = None
    for w in words_dict.values():
        if w.count_incorrect > num_incorrect:
            most_incorrect = w.foreign
            num_incorrect = w.count_incorrect
    return most_incorrect

def determine_most_difficult(words_dict):
    num_seen = 0
    most_seen = None
    for w in words_dict.values():
        if w.count_seen > num_seen:
            most_seen = w.foreign
            num_seen = w.count_seen
    return most_seen

@bp.route('/get-stats', methods=['POST'])
def get_stats():
    data = request.json
    session_id = data.get('session_id')
    
    from api.study import sessions
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    walking_window = sessions[session_id]
    words_dict = walking_window.words_dict
    
    total_known = count_known_words(words_dict)
    most_incorrect = determine_most_incorrect(words_dict)
    most_difficult = determine_most_difficult(words_dict)
    
    return jsonify({
        'total_known': total_known,
        'most_incorrect': most_incorrect,
        'most_difficult': most_difficult
    })

