import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function TextPage() {
  const navigate = useNavigate();
  const [flashword, setFlashword] = useState(null);
  const [answer, setAnswer] = useState('');
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
    const result = await api.getRandomWords(sid, 1);
    if (result.words && result.words.length > 0) {
      setFlashword(result.words[0]);
      setAnswer('');
      setFeedback(null);
      setDisabled(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || !answer.trim()) return;
    setDisabled(true);
    
    const result = await api.checkAnswer(sessionId, flashword, answer);
    
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
      setTimeout(() => {
        setFeedback(null);
        setDisabled(false);
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
      <div className="text-4xl text-black">Loading...</div>
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
        <div className="text-center mb-12">
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type translation here..."
            disabled={disabled}
            className="w-full px-6 py-4 bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl text-4xl text-center text-black disabled:opacity-50"
            autoFocus
          />
          
          <button
            type="submit"
            disabled={disabled || !answer.trim()}
            className="w-full bg-[#0f606b] text-white py-6 rounded-2xl text-3xl font-bold hover:bg-[#0a4a52] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

