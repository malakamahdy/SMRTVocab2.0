from flask import Blueprint, request, jsonify
import sys
import os
import random
import logging
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
        'Spanish': 'Mexican Spanish',
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
    all_current_words = [word_to_dict(w) for w in walking_window.current_words]
    
    if not all_current_words:
        return jsonify({'error': 'No words in walking window'}), 400
    
    # Limit to max 10 random words
    current_words = random.sample(all_current_words, min(10, len(all_current_words)))
    
    language = settings.LANGUAGE
    language_name = get_language_name_for_prompt(language)
    words_list = build_words_list(current_words)
    
    prompt = f"""Write a 2-3 paragraph story in {language_name} using: {words_list}."""

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
    all_current_words = [word_to_dict(w) for w in walking_window.current_words]
    
    if not all_current_words:
        return jsonify({'error': 'No words in walking window'}), 400
    
    # Limit to max 10 random words
    current_words = random.sample(all_current_words, min(10, len(all_current_words)))
    
    language = settings.LANGUAGE
    language_name = get_language_name_for_prompt(language)
    words_list = build_words_list(current_words)
    
    prompt = f"""Write a 2-3 paragraph passage in {language_name} about {topic} using: {words_list}."""

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

@bp.route('/fill-in-the-blank', methods=['POST'])
def generate_fill_in_the_blank():
    """
    Generate a fill-in-the-blank sentence focusing on a single word from the walking window.
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
    all_current_words = [word_to_dict(w) for w in walking_window.current_words]
    
    if not all_current_words:
        return jsonify({'error': 'No words in walking window'}), 400
    
    # Select one random word to focus on
    target_word = random.choice(all_current_words)
    
    # Get other words for the dropdown (excluding the target word)
    other_words = [w for w in all_current_words if w['foreign'] != target_word['foreign']]
    # Select up to 3 other random words for the dropdown
    distractors = random.sample(other_words, min(3, len(other_words)))
    
    language = settings.LANGUAGE
    language_name = get_language_name_for_prompt(language)
    
    prompt = f"""Write one complete sentence in {language_name} using "{target_word['foreign']}". Place the word in the middle or end of the sentence, not at the beginning. Avoid exclamations. No explanations, no English, just the sentence."""
    
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
        
        raw_text = response.text.strip()
        
        # Extract only the sentence - remove any English explanations or metadata
        # Split by common separators and take the first substantial line
        lines = raw_text.split('\n')
        sentence = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Skip lines that are clearly English explanations (contain common English words)
            english_indicators = ['means', 'translation', 'example', 'sentence', 'word', 'here', 'this is']
            if any(indicator in line.lower() for indicator in english_indicators):
                continue
            # Skip lines that are just punctuation or very short
            if len(line) < 5:
                continue
            # Take the first substantial line that looks like a sentence
            sentence = line
            # Remove trailing punctuation that might be from formatting
            sentence = sentence.rstrip('.,;:')
            break
        
        # Fallback: if no good line found, use the first line and clean it
        if not sentence:
            sentence = raw_text.split('\n')[0].strip()
            # Remove common prefixes/suffixes that might be added
            prefixes_to_remove = ['Sentence:', 'Example:', 'Here is:', 'Translation:']
            for prefix in prefixes_to_remove:
                if sentence.lower().startswith(prefix.lower()):
                    sentence = sentence[len(prefix):].strip()
            sentence = sentence.rstrip('.,;:')
        
        # Final cleanup: remove quotes if the entire sentence is quoted
        if sentence.startswith('"') and sentence.endswith('"'):
            sentence = sentence[1:-1]
        elif sentence.startswith("'") and sentence.endswith("'"):
            sentence = sentence[1:-1]
        
        # Remove exclamation marks (replace with period if at end, or remove if in middle)
        if '!' in sentence:
            sentence = sentence.replace('!', '.')
            # Remove duplicate periods
            while '..' in sentence:
                sentence = sentence.replace('..', '.')
            sentence = sentence.rstrip('.')
        
        # Verify the sentence contains the target word (case-insensitive)
        sentence_lower = sentence.lower()
        target_word_lower = target_word['foreign'].lower()
        
        if target_word_lower not in sentence_lower:
            # If target word not found, log warning but continue (word might be in different form)
            logging.warning(f"Target word '{target_word['foreign']}' not found in generated sentence: {sentence}")
        else:
            # Check if word appears at the beginning (prefer middle/end)
            # Find the position of the word in the sentence
            word_pos = sentence_lower.find(target_word_lower)
            # Check if word is at the very beginning (first 5 characters)
            if word_pos >= 0 and word_pos < 5:
                logging.warning(f"Target word '{target_word['foreign']}' appears near the beginning of sentence: {sentence}")
        
        # Build choices list: target word + distractors, shuffled
        choices = [target_word] + distractors
        random.shuffle(choices)
        
        return jsonify({
            'success': True,
            'sentence': sentence,
            'target_word': target_word,
            'choices': choices
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate sentence: {str(e)}'}), 500

