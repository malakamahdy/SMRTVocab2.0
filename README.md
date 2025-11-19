# SMRT Vocab 2.0 - Web Application

A fully functional React web application with Python Flask backend, adapted from the original desktop Python application.

## Project Structure

```
SMRTVocab2.0/
├── backend/              # Python Flask API server
│   ├── api/             # API endpoints (auth, classrooms, stats, study, etc.)
│   ├── models/          # Data models (Word, WalkingWindow)
│   ├── utils/           # Utilities (Settings, TextToSpeech)
│   ├── UserWords/       # User word CSV files (excluded from git)
│   ├── AccountInformation.csv  # User accounts with roles (excluded from git)
│   ├── Classrooms.csv   # Classroom data (excluded from git)
│   ├── ClassroomMembers.csv  # Student-classroom memberships (excluded from git)
│   ├── app.py           # Flask application entry point
│   └── requirements.txt # Python dependencies
├── frontend/            # React web application
│   ├── src/
│   │   ├── pages/       # React page components (including classroom pages)
│   │   ├── services/    # API service layer
│   │   └── App.jsx      # Main app component with routing
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

## Usage

1. Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`)
2. Register a new account:
   - Choose **"Student"** to join classrooms and track your learning progress
   - Choose **"Instructor"** to create and manage classrooms for your students
3. Start learning!

### For Instructors:
- Click **"Manage Classrooms"** from the menu to create new classrooms
- Share the generated classroom code with your students
- View classroom details including:
  - Dashboard statistics (total students, average progress, accuracy)
  - Real-time leaderboard with student rankings
  - Individual student progress by clicking **"View student progress"**
  - Detailed word learning status for each student:
    - Words currently being learned
    - Words students are struggling with
    - Words students have mastered

### For Students:
- Click **"My Classroom"** from the menu to:
  - Join classrooms using codes provided by your instructor
  - View your position on the leaderboard
  - See your progress compared to other students in the classroom
  - Access all classrooms you've joined (memberships persist across sessions)

## Features

- **User Authentication**: Login and registration system with role-based access (Student/Instructor)
- **Classroom Management** (Kahoot-style):
  - Instructors can create classrooms and generate join codes
  - Students can join classrooms using codes
  - Real-time leaderboards showing student rankings
  - Classroom memberships persist across sessions
  - Instructors can view detailed student progress:
    - Words students are currently learning
    - Words students are struggling with
    - Words students have mastered
- **Multiple Study Modes**:
  - Multiple Choice Flashcards
  - Text-Input Flashcards
  - Review Mode (for known words)
  - Guided Reading Mode
- **Statistics**: Track your learning progress with visual charts
- **Settings**: Customize your learning experience
- **Text-to-Speech**: Pronunciation support for multiple languages
- **Spaced Repetition**: Intelligent word learning algorithm
- **Multi-language Support**: Spanish, French, Arabic, Japanese, Mandarin, Hieroglyphic

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns user role)
- `POST /api/auth/register` - User registration (requires role: Student or Instructor)

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

### Classrooms
- `POST /api/classrooms/create` - Create a new classroom (instructor only)
- `GET /api/classrooms/instructor/<email>` - Get all classrooms for an instructor
- `POST /api/classrooms/join` - Join a classroom using a code (student only)
- `GET /api/classrooms/<code>` - Get classroom details
- `GET /api/classrooms/<code>/members` - Get all members of a classroom
- `GET /api/classrooms/student/<email>` - Get all classrooms a student has joined

### Classroom Statistics
- `GET /api/classroom-stats/leaderboard/<code>` - Get classroom leaderboard
- `GET /api/classroom-stats/student/<code>/<email>` - Get student progress in classroom
- `GET /api/classroom-stats/dashboard/<code>` - Get instructor dashboard with aggregated stats
- `GET /api/classroom-stats/student/<code>/<email>/walking-window` - Get student's current words being learned
- `GET /api/classroom-stats/student/<code>/<email>/all-words/<language>` - Get all student words categorized by status

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
- Classroom data is stored in CSV files: `Classrooms.csv` and `ClassroomMembers.csv`
- Audio files for TTS are cached in the `audio_files` directory
- User roles (Student/Instructor) are stored in `AccountInformation.csv` and persist across sessions
- Classroom memberships persist across login sessions - students remain in classrooms after logging out

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
