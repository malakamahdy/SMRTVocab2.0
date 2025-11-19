const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },
  
  register: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },
  
  // Study
  initStudy: async (username, language) => {
    const response = await fetch(`${API_BASE_URL}/study/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, language })
    });
    return response.json();
  },
  
  getRandomWords: async (sessionId, count) => {
    const response = await fetch(`${API_BASE_URL}/study/random-words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, count })
    });
    return response.json();
  },
  
  checkAnswer: async (sessionId, flashword, answer) => {
    const response = await fetch(`${API_BASE_URL}/study/check-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, flashword, answer })
    });
    return response.json();
  },
  
  markKnown: async (sessionId, flashword) => {
    const response = await fetch(`${API_BASE_URL}/study/mark-known`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, flashword })
    });
    return response.json();
  },
  
  saveSession: async (sessionId, username) => {
    const response = await fetch(`${API_BASE_URL}/study/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, username })
    });
    return response.json();
  },
  
  getKnownWords: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/study/get-known-words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    return response.json();
  },

  checkReviewAnswer: async (sessionId, flashword, answer) => {
    const response = await fetch(`${API_BASE_URL}/study/check-review-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, flashword, answer })
    });
    return response.json();
  },
  
  // Stats
  getStats: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/stats/get-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    return response.json();
  },
  
  // Settings
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/get`);
    return response.json();
  },
  
  updateSettings: async (sessionId, settings) => {
    const response = await fetch(`${API_BASE_URL}/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, ...settings })
    });
    return response.json();
  },
  
  // TTS
  getTTS: async (word, language) => {
    try {
      const response = await fetch(`${API_BASE_URL}/words/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, language })
      });
      
      if (!response.ok) {
        console.error('TTS API error:', response.status, response.statusText);
        return { error: `Failed to get TTS: ${response.statusText}` };
      }
      
      const result = await response.json();
      console.log('TTS result:', result);
      
      // If successful, play the audio
      if (result.success && result.audio_url) {
        const audioUrl = `http://localhost:5000${result.audio_url}`;
        console.log('Playing audio from URL:', audioUrl);
        
        const audio = new Audio(audioUrl);
        
        // Set up event listeners for debugging
        audio.addEventListener('loadstart', () => {
          console.log('Audio loading started');
        });
        
        audio.addEventListener('loadeddata', () => {
          console.log('Audio data loaded');
        });
        
        audio.addEventListener('canplay', () => {
          console.log('Audio can play');
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          console.error('Audio error details:', audio.error);
          console.error('Audio error code:', audio.error?.code);
          console.error('Audio error message:', audio.error?.message);
          console.error('Audio src:', audio.src);
          console.error('Audio networkState:', audio.networkState);
          console.error('Audio readyState:', audio.readyState);
          
          // Try to fetch the URL directly to see if it's accessible
          fetch(audioUrl)
            .then(response => {
              console.log('Direct fetch response status:', response.status);
              console.log('Direct fetch response ok:', response.ok);
              if (!response.ok) {
                console.error('Direct fetch error:', response.statusText);
                return response.text();
              }
            })
            .then(text => {
              if (text) {
                console.error('Direct fetch error body:', text);
              }
            })
            .catch(fetchError => {
              console.error('Direct fetch exception:', fetchError);
            });
        });
        
        audio.addEventListener('play', () => {
          console.log('Audio started playing');
        });
        
        // Load the audio first, then play when ready
        audio.load();
        
        // Wait for audio to be ready to play
        const playAudio = () => {
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Audio playing successfully');
              })
              .catch(error => {
                console.error('Error playing audio:', error);
                // Some browsers require user interaction before playing audio
                if (error.name === 'NotAllowedError') {
                  console.error('Audio play was blocked. User interaction may be required.');
                  alert('Please click the button again to play audio. Some browsers require user interaction.');
                }
              });
          }
        };
        
        // Try to play when audio can play
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          playAudio();
        } else {
          audio.addEventListener('canplay', playAudio, { once: true });
          // Fallback: try to play after a short delay
          setTimeout(() => {
            if (audio.readyState >= 2) {
              playAudio();
            }
          }, 100);
        }
      } else {
        console.error('TTS failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('TTS fetch error:', error);
      return { error: `Failed to fetch TTS: ${error.message}` };
    }
  },
  
  // Reading/Guided Reading
  getCurrentWords: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/study/get-current-words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    return response.json();
  },
  
  generateShortStory: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/reading/short-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    return response.json();
  },
  
  generateTopicalPassage: async (sessionId, topic) => {
    const response = await fetch(`${API_BASE_URL}/reading/topical-passage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, topic })
    });
    return response.json();
  }
};

