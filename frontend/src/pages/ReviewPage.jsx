import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [flashword, setFlashword] = useState(null);
  const [choices, setChoices] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [mode, setMode] = useState('choice'); // 'choice' or 'text'
  const [answer, setAnswer] = useState('');
  const [knownWords, setKnownWords] = useState([]);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
    loadKnownWords(storedSessionId);
  }, [navigate]);

  const loadKnownWords = async (sid) => {
    const result = await api.getKnownWords(sid);
    if (result.words && result.words.length > 0) {
      setKnownWords(result.words);
      loadRandomWord(result.words);
    } else {
      setFeedback({ text: 'No words to review!', color: '#f37d59' });
      setFlashword(null);
    }
  };

  const loadRandomWord = (words) => {
    if (words.length === 0) {
      setFeedback({ text: 'No words to review!', color: '#f37d59' });
      return;
    }
    
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setFlashword(randomWord);
    
    if (words.length >= 4 && Math.random() > 0.5) {
      // Multiple choice mode
      setMode('choice');
      const otherWords = words.filter(w => w.foreign !== randomWord.foreign);
      const shuffled = [randomWord, ...otherWords.slice(0, 3)].sort(() => Math.random() - 0.5);
      setChoices(shuffled);
    } else {
      // Text input mode
      setMode('text');
      setChoices([]);
    }
    
    setAnswer('');
    setFeedback(null);
    setDisabled(false);
  };

  const handleChoice = async (choice) => {
    if (disabled) return;
    setDisabled(true);
    
    const result = await api.checkReviewAnswer(sessionId, flashword, choice.english);
    
    if (result.correct) {
      setFeedback({ text: 'Correct!', color: '#77721f' });
      setTimeout(() => {
        loadKnownWords(sessionId);
      }, 1000);
    } else {
      setFeedback({ 
        text: `Not quite! ${flashword.foreign} means ${flashword.english.toLowerCase()}`, 
        color: '#f37d59' 
      });
      setTimeout(() => {
        loadKnownWords(sessionId);
      }, 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || !answer.trim()) return;
    setDisabled(true);
    
    const result = await api.checkReviewAnswer(sessionId, flashword, answer);
    
    if (result.correct) {
      setFeedback({ text: 'Correct!', color: '#77721f' });
      setTimeout(() => {
        loadKnownWords(sessionId);
      }, 1000);
    } else {
      setFeedback({ 
        text: `Not quite! ${flashword.foreign} means ${flashword.english.toLowerCase()}`, 
        color: '#f37d59' 
      });
      setTimeout(() => {
        loadKnownWords(sessionId);
      }, 2000);
    }
  };

  const handleTTS = async () => {
    const settings = await api.getSettings();
    await api.getTTS(flashword.foreign, settings.language);
  };

  if (!flashword && !feedback) {
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
      
      <div className="max-w-6xl mx-auto">
        {flashword && (
          <>
            <div className="text-center mb-8">
              <div className="text-9xl font-bold text-black mb-8">
                {flashword.foreign}
              </div>
              
              <button
                onClick={handleTTS}
                className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
              >
                Speak Text
              </button>
            </div>
            
            {feedback && (
              <div className={`text-center mb-8 p-6 rounded-xl text-4xl font-bold text-white`}
                   style={{ backgroundColor: feedback.color }}>
                {feedback.text}
              </div>
            )}
            
            {mode === 'choice' && choices.length > 0 && (
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
            )}
            
            {mode === 'text' && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

