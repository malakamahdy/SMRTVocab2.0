import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
    loadSettings();
  }, [navigate]);

  const loadSettings = async () => {
    const result = await api.getSettings();
    setSettings(result);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleApply = async () => {
    const result = await api.updateSettings(sessionId, settings);
    if (result.success) {
      if (result.session_id) {
        localStorage.setItem('sessionId', result.session_id);
        setSessionId(result.session_id);
      }
      setHasChanges(false);
      alert('Settings updated successfully!');
    }
  };

  if (!settings) {
    return <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
      <div className="text-4xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate('/menu')}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-8xl font-bold text-center mb-12 text-black">Settings</h1>
        
        <div className="bg-white rounded-2xl p-8 space-y-8">
          {/* Sliders */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-2xl font-bold mb-2">
                Known Word Requirement: {settings.known_threshold}
              </label>
              <input
                type="range"
                min={settings.known_threshold_min}
                max={settings.known_threshold_max}
                value={settings.known_threshold}
                onChange={(e) => handleChange('known_threshold', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-2xl font-bold mb-2">
                Correct-Incorrect Gap: {settings.known_delta}
              </label>
              <input
                type="range"
                min={settings.known_delta_min}
                max={settings.known_delta_max}
                value={settings.known_delta}
                onChange={(e) => handleChange('known_delta', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-2xl font-bold mb-2">
                Spaced Repetition Amount: {settings.srs_queue_length}
              </label>
              <input
                type="range"
                min={settings.srs_queue_length_min}
                max={settings.srs_queue_length_max}
                value={settings.srs_queue_length}
                onChange={(e) => handleChange('srs_queue_length', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-2xl font-bold mb-2">
                Study Batch Size: {settings.walking_window_size}
              </label>
              <input
                type="range"
                min={settings.walking_window_size_min}
                max={settings.walking_window_size_max}
                value={settings.walking_window_size}
                onChange={(e) => handleChange('walking_window_size', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Language Selection */}
          <div>
            <label className="block text-2xl font-bold mb-2">Language Selection</label>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-4 py-3 bg-[#acb87c] text-white rounded-xl text-xl font-bold"
            >
              {settings.language_options.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          
          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-2xl font-bold">Flashcard Display Language</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.foreign_to_english}
                  onChange={(e) => handleChange('foreign_to_english', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#77721f]"></div>
                <span className="ml-3 text-xl">{settings.foreign_to_english ? settings.language : 'English'}</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-2xl font-bold">Auto Pronunciation</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_tts}
                  onChange={(e) => handleChange('auto_tts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#77721f]"></div>
                <span className="ml-3 text-xl">{settings.auto_tts ? 'On' : 'Off'}</span>
              </label>
            </div>
            
            <div>
              <label className="block text-2xl font-bold mb-2">
                Volume: {settings.volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <button
            onClick={handleApply}
            disabled={!hasChanges}
            className="w-full bg-[#0f606b] text-white py-6 rounded-xl text-3xl font-bold hover:bg-[#0a4a52] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

