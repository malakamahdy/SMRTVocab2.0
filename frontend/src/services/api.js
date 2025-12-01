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
  
  register: async (email, password, role) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
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
    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Failed to check answer' };
    }
    return data;
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
  },

  generateFillInTheBlank: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/reading/fill-in-the-blank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    return response.json();
  },

  // Classrooms
  createClassroom: async (name, instructorEmail) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, instructor_email: instructorEmail })
    });
    return response.json();
  },

  getInstructorClassrooms: async (email) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/instructor/${encodeURIComponent(email)}`);
    return response.json();
  },

  joinClassroom: async (code, studentEmail) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, student_email: studentEmail })
    });
    return response.json();
  },

  getClassroomDetails: async (code) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/${encodeURIComponent(code)}`);
    return response.json();
  },

  getClassroomMembers: async (code) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/${encodeURIComponent(code)}/members`);
    return response.json();
  },

  getStudentClassrooms: async (email) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/student/${encodeURIComponent(email)}`);
    return response.json();
  },

  // Classroom Stats
  getClassroomLeaderboard: async (code) => {
    const response = await fetch(`${API_BASE_URL}/classroom-stats/leaderboard/${encodeURIComponent(code)}`);
    return response.json();
  },

  getStudentProgressInClassroom: async (code, email) => {
    const response = await fetch(`${API_BASE_URL}/classroom-stats/student/${encodeURIComponent(code)}/${encodeURIComponent(email)}`);
    return response.json();
  },

  getInstructorDashboard: async (code) => {
    const response = await fetch(`${API_BASE_URL}/classroom-stats/dashboard/${encodeURIComponent(code)}`);
    return response.json();
  },

  getStudentWalkingWindow: async (code, email, language) => {
    const url = `${API_BASE_URL}/classroom-stats/student/${encodeURIComponent(code)}/${encodeURIComponent(email)}/walking-window${language ? `?language=${encodeURIComponent(language)}` : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  getStudentAllWords: async (code, email, language) => {
    const response = await fetch(`${API_BASE_URL}/classroom-stats/student/${encodeURIComponent(code)}/${encodeURIComponent(email)}/all-words/${encodeURIComponent(language)}`);
    return response.json();
  },

  getStudentWordlistStats: async (code, email, language) => {
    const response = await fetch(`${API_BASE_URL}/classroom-stats/student/${encodeURIComponent(code)}/${encodeURIComponent(email)}/wordlist-stats/${encodeURIComponent(language)}`);
    return response.json();
  },

  // Classroom Assignments
  createAssignment: async (classroomCode, assignmentName, instructorEmail, language, words) => {
    const response = await fetch(`${API_BASE_URL}/classroom-assignments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classroom_code: classroomCode,
        assignment_name: assignmentName,
        instructor_email: instructorEmail,
        language: language,
        words: words
      })
    });
    return response.json();
  },

  getClassroomAssignments: async (classroomCode) => {
    const response = await fetch(`${API_BASE_URL}/classroom-assignments/classroom/${encodeURIComponent(classroomCode)}`);
    return response.json();
  },

  getAssignmentDetails: async (assignmentId) => {
    const response = await fetch(`${API_BASE_URL}/classroom-assignments/${encodeURIComponent(assignmentId)}`);
    return response.json();
  },

  deleteAssignment: async (assignmentId, instructorEmail) => {
    const response = await fetch(`${API_BASE_URL}/classroom-assignments/${encodeURIComponent(assignmentId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_email: instructorEmail })
    });
    return response.json();
  },

  getAssignmentStats: async (assignmentId) => {
    const response = await fetch(`${API_BASE_URL}/classroom-assignments/${encodeURIComponent(assignmentId)}/stats`);
    return response.json();
  },

  getStudentAssignmentProgress: async (assignmentId, studentEmail) => {
    const response = await fetch(`${API_BASE_URL}/classroom-assignments/${encodeURIComponent(assignmentId)}/progress/${encodeURIComponent(studentEmail)}`);
    return response.json();
  },

  initAssignmentStudy: async (username, language, assignmentId) => {
    const response = await fetch(`${API_BASE_URL}/study/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, language, assignment_id: assignmentId })
    });
    return response.json();
  }
};

