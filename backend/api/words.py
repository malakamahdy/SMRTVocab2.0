from flask import Blueprint, request, jsonify, send_from_directory
import sys
import os
import urllib.parse
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import text_to_speech

bp = Blueprint('words', __name__, url_prefix='/api/words')

@bp.route('/tts', methods=['POST'])
def get_tts():
    import logging
    
    data = request.json
    word = data.get('word')
    language = data.get('language', 'spanish')
    
    if not word:
        return jsonify({'error': 'Word is required'}), 400
    
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
    
    logging.info(f"Generating TTS for word: '{word}' in language: {lang}")
    
    try:
        audio_path = text_to_speech.generate_pronunciation(word, lang)
        
        if audio_path and os.path.exists(audio_path):
            # Get the actual filename that was saved (just the filename, not the full path)
            filename = os.path.basename(audio_path)
            # URL encode the filename for the URL
            encoded_filename = urllib.parse.quote(filename, safe='')
            logging.info(f"TTS generated successfully: {audio_path}")
            return jsonify({
                'success': True,
                'audio_url': f'/api/words/audio/{lang}/{encoded_filename}'
            })
        else:
            logging.error(f"TTS generation failed: audio_path={audio_path}, exists={os.path.exists(audio_path) if audio_path else False}")
            return jsonify({'error': 'Failed to generate pronunciation - file not created'}), 400
    except Exception as e:
        logging.error(f"Error in TTS generation: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to generate pronunciation: {str(e)}'}), 500

@bp.route('/audio/<lang>/<path:filename>')
def serve_audio(lang, filename):
    """Serve audio files from the audio_files directory."""
    from flask import Response, make_response
    import logging
    
    # Get the base directory (backend directory)
    # From backend/api/words.py, go up 2 levels: api -> backend
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    audio_dir = os.path.join(base_dir, 'audio_files', lang)
    
    # Decode the filename from URL encoding
    decoded_filename = urllib.parse.unquote(filename)
    
    # Security: ensure filename doesn't contain path traversal
    # After decoding, check if it's just a filename (no path separators)
    if '..' in decoded_filename or os.path.sep in decoded_filename or '/' in decoded_filename:
        logging.warning(f"Invalid filename attempted: {decoded_filename}")
        return jsonify({'error': 'Invalid filename'}), 400
    
    # Ensure the file exists
    file_path = os.path.join(audio_dir, decoded_filename)
    
    # Log for debugging
    logging.info(f"Attempting to serve audio: {file_path}")
    logging.info(f"Audio directory: {audio_dir}")
    logging.info(f"Decoded filename: {decoded_filename}")
    
    if not os.path.exists(file_path):
        # Log for debugging
        logging.error(f"Audio file not found: {file_path}")
        logging.error(f"Looking in directory: {audio_dir}")
        if os.path.exists(audio_dir):
            try:
                files = os.listdir(audio_dir)
                logging.error(f"Files in directory: {files}")
            except Exception as e:
                logging.error(f"Error listing directory: {e}")
        else:
            logging.error(f"Directory does not exist: {audio_dir}")
        logging.error(f"Requested filename: {decoded_filename}")
        
        # Return JSON error for easier debugging
        response = make_response(jsonify({'error': 'Audio file not found', 'requested': decoded_filename, 'path': file_path}), 404)
        response.headers['Content-Type'] = 'application/json'
        return response
    
    # Serve the file with proper CORS headers
    response = send_from_directory(audio_dir, decoded_filename, mimetype='audio/mpeg', as_attachment=False)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

