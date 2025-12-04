"""
TextToSpeech.py
TTS Module for the SMRT Vocab app

Last Edited: 11/13/2024
"""

from gtts import gTTS
import pygame
import os
import logging
import threading
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import settings
import re

#Base directory for audio files
# Get the backend directory (one level up from utils)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_AUDIO_DIR = os.path.join(BACKEND_DIR, "audio_files")
LANGUAGES = {"english": "en", "spanish": "es", "french": "fr", "arabic": "ar", "japanese": "ja", "mandarin": "zh", "tokipona": "en"}

# Initialize pygame mixer (handle environments without audio devices like Cloud Run)
_pygame_mixer_available = False
try:
    pygame.mixer.init()
    _pygame_mixer_available = True
except Exception as e:
    # In environments without audio (like Cloud Run), pygame mixer init will fail
    # This is okay - audio playback won't work but the app can still generate audio files
    logging.warning(f"Pygame mixer initialization failed (this is expected in serverless environments): {e}")

# Ensure lang-specific directories exist
for language in LANGUAGES:
    os.makedirs(os.path.join(BASE_AUDIO_DIR, language), exist_ok=True)

def get_audio_file_path(word, lang):
    """Generates a standardized path for each word's audio file based on lang."""
    return os.path.join(BASE_AUDIO_DIR, lang, f"{word}.mp3")

def generate_pronunciation(word, lang):
    """
    Generates and saves the pronunciation audio for a word if it doesn't already exist.
    :param word: The word to pronounce
    :param lang: The lang of the word ('english', 'spanish', 'french')
    """
    lang_code = LANGUAGES.get(lang.lower())
    if not lang_code:
        logging.info(f"Language '{lang.lower()}' is not supported.")
        return None

    # Ignore latinized words or pinyin in FOREIGN cells of CSV AKA Avoid double pronunciations of words.
    if lang.lower() == "mandarin":
        word = "".join(re.findall(r"[\u4e00-\u9fff]+", word))
        if not word:
            logging.warning(f"No valid Chinese characters found for pronunciation.")
            return None

    # Get the path for the audio file
    audio_file_path = get_audio_file_path(word, lang)

    # Check if the file already exists
    if not os.path.isfile(audio_file_path):
        try:
            # Generate the pronunciation audio and save it
            tts = gTTS(text=word, lang=lang_code)
            tts.save(audio_file_path)
            logging.info(f"Saved pronunciation for '{word}' in {lang}.")
        except Exception as e:
            logging.error(f"Error generating pronunciation: {e}")
            return None
    else:
        logging.info(f"Pronunciation for '{word}' in {lang} already exists.")

    return audio_file_path

def play_audio_async(file_path):
    """Play audio file asynchronously."""
    if not _pygame_mixer_available:
        logging.info("Audio playback not available (no audio device)")
        return
    try:
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.set_volume(settings.VOLUME/100)
        pygame.mixer.music.play()
    except Exception as e:
        logging.error(f"Error playing audio: {e}")

def play_pronunciation(word, lang):
    """Generate pronunciation if needed and play it in a separate thread."""
    audio_file_path = generate_pronunciation(word, lang)
    if audio_file_path:
        # Play audio in a separate thread
        threading.Thread(target=play_audio_async, args=(audio_file_path,), daemon=True).start()
    return audio_file_path

