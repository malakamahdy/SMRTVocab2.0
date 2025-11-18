import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ChoicePage() {
  const navigate = useNavigate();
  const [flashword, setFlashword] = useState(null);
  const [choices, setChoices] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
    loadNewWord(storedSessionId);
  }, [navigate]);

  const loadNewWord = async (sid) => {
    const result = await api.getRandomWords(sid, 4);
    if (result.words && result.words.length >= 4) {
      const [fw, ...rest] = result.words;
      setFlashword(fw);
      
      // Shuffle choices
      const shuffled = [fw, ...rest].sort(() => Math.random() - 0.5);
      setChoices(shuffled);
      setFeedback(null);
      setDisabled(false);
    }
  };

  const handleChoice = async (choice) => {
    if (disabled) return;
    setDisabled(true);
    
    const result = await api.checkAnswer(sessionId, flashword, choice.english);
    
    if (result.correct) {
      setFeedback({ text: 'Correct!', color: '#77721f' });
      setTimeout(() => {
        loadNewWord(sessionId);
      }, 1000);
    } else {
      setFeedback({ 
        text: `Not quite! ${flashword.foreign} means ${flashword.english.toLowerCase()}`, 
        color: '#f37d59' 
      });
      // For incorrect answers, reload the same word so user can try again
      // The word stays in current_words, so it may appear again
      setTimeout(() => {
        loadNewWord(sessionId);
      }, 2000);
    }
  };

  const handleMarkKnown = async () => {
    await api.markKnown(sessionId, flashword);
    loadNewWord(sessionId);
  };

  const handleTTS = async () => {
    const settings = await api.getSettings();
    await api.getTTS(flashword.foreign, settings.language);
  };

  if (!flashword) {
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
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-9xl font-bold text-black mb-8">
            {flashword.foreign}
          </div>
          
          <div className="flex justify-end gap-4 mb-8">
            <button
              onClick={handleMarkKnown}
              className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
            >
              Already Know
            </button>
            <button
              onClick={handleTTS}
              className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
            >
              Speak Text
            </button>
          </div>
        </div>
        
        {feedback && (
          <div className={`text-center mb-8 p-6 rounded-xl text-4xl font-bold text-white`}
               style={{ backgroundColor: feedback.color }}>
            {feedback.text}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-6">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleChoice(choice)}
              disabled={disabled}
              className="bg-[#acb87c] text-white py-12 rounded-2xl text-3xl font-bold hover:bg-[#77721f] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {choice.english.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

