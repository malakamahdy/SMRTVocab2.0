# SMRT Vocab 2.0 - Web Application

A fully functional React web application with Python Flask backend, adapted from the original desktop Python application.

## Project Structure

```
SMRTVocab2.0/
├── backend/              # Python Flask API server
│   ├── api/             # API endpoints
│   ├── models/          # Data models (Word, WalkingWindow)
│   ├── utils/           # Utilities (Settings, TextToSpeech)
│   ├── UserWords/       # User word CSV files
│   ├── app.py           # Flask application entry point
│   └── requirements.txt # Python dependencies
├── frontend/            # React web application
│   ├── src/
│   │   ├── pages/       # React page components
│   │   ├── services/    # API service layer
│   │   └── App.jsx      # Main app component
│   └── package.json     # Node.js dependencies
└── SMRT-PROJECT/        # Original Python desktop application
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure the UserWords directory contains template CSV files (already copied from SMRT-PROJECT).

4. Run the Flask server:
```bash
python app.py
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns)

## Features

- **User Authentication**: Login and registration system
- **Multiple Study Modes**:
  - Multiple Choice Flashcards
  - Text-Input Flashcards
  - Review Mode (for known words)
- **Statistics**: Track your learning progress with visual charts
- **Settings**: Customize your learning experience
- **Text-to-Speech**: Pronunciation support for multiple languages
- **Spaced Repetition**: Intelligent word learning algorithm
- **Multi-language Support**: Spanish, French, Arabic, Japanese, Mandarin, Hieroglyphic

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Study
- `POST /api/study/init` - Initialize study session
- `POST /api/study/random-words` - Get random words for study
- `POST /api/study/check-answer` - Check answer correctness
- `POST /api/study/mark-known` - Mark word as known
- `POST /api/study/save` - Save study session
- `POST /api/study/get-known-words` - Get known words for review

### Statistics
- `POST /api/stats/get-stats` - Get user statistics

### Settings
- `GET /api/settings/get` - Get current settings
- `POST /api/settings/update` - Update settings

### Words
- `POST /api/words/tts` - Generate text-to-speech audio

## Technologies Used

### Backend
- Python 3.x
- Flask 3.0.0
- Flask-CORS 4.0.0
- gTTS (Google Text-to-Speech)
- pygame (for audio playback)

### Frontend
- React 18.3.1
- React Router 6.28.0
- Tailwind CSS 3.4.15
- Recharts 2.10.3 (for statistics charts)
- Vite 5.4.8

## Notes

- All backend logic from the original Python application is preserved
- The Walking Window algorithm and spaced repetition system are fully functional
- User data is stored in CSV files (same format as original application)
- Audio files for TTS are cached in the `audio_files` directory

## Development

To run both frontend and backend simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
python app.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## License

This project is licensed under the ECL License 2.0 - see the original SMRT-PROJECT for details.

## Acknowledgments

- Lang Gang - Original development team
- Texas A&M University - Corpus Christi
