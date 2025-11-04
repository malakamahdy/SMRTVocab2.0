# Quick Setup Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

The backend API will start on `http://localhost:5000`

## Frontend Setup

1. Navigate to frontend directory (in a new terminal):
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

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken)

## Usage

1. Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`)
2. Register a new account or login with existing credentials
3. Start learning!

## Important Notes

- Make sure the backend is running before using the frontend
- The backend needs to be running on port 5000 (default)
- User data is stored in CSV files in the `backend/UserWords/` directory
- Audio files for text-to-speech are cached in `backend/audio_files/`

## Troubleshooting

### Backend won't start
- Check if Python is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 5000 is already in use

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`

### API connection errors
- Ensure backend is running on `http://localhost:5000`
- Check CORS settings in `backend/app.py`
- Verify the API_BASE_URL in `frontend/src/services/api.js`

