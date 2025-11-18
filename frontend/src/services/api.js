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
    const response = await fetch(`${API_BASE_URL}/words/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, language })
    });
    return response.json();
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

