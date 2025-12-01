import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function FillInTheBlankPage() {
  const navigate = useNavigate();
  const [sentence, setSentence] = useState('');
  const [targetWord, setTargetWord] = useState(null);
  const [choices, setChoices] = useState([]);
  const [selectedWord, setSelectedWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
    generateNewSentence(storedSessionId);
  }, [navigate]);

  const generateNewSentence = async (sid) => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setSelectedWord('');
    setDisabled(false);
    
    try {
      const result = await api.generateFillInTheBlank(sid);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      
      if (result.success && result.sentence && result.target_word) {
        setSentence(result.sentence);
        setTargetWord(result.target_word);
        setChoices(result.choices || []);
      } else {
        setError('Failed to generate sentence');
      }
    } catch (err) {
      setError('Failed to generate sentence. Please try again.');
      console.error('Error generating sentence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || !selectedWord) return;
    
    setDisabled(true);
    
    // Check if selected word matches the target word
    const isCorrect = selectedWord === targetWord.foreign;
    
    if (isCorrect) {
      setFeedback({ 
        text: 'Correct!', 
        color: '#77721f' 
      });
      setTimeout(() => {
        generateNewSentence(sessionId);
      }, 1500);
    } else {
      setFeedback({ 
        text: `Not quite! The correct word is "${targetWord.foreign}" (${targetWord.english})`, 
        color: '#f37d59' 
      });
      setTimeout(() => {
        generateNewSentence(sessionId);
      }, 2500);
    }
  };

  // Replace the target word in the sentence with a blank
  const getSentenceWithBlank = () => {
    if (!sentence || !targetWord) return sentence;
    
    // Escape special regex characters in the word
    const escapedWord = targetWord.foreign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace the target word with a blank (case-insensitive, word boundaries)
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    const result = sentence.replace(regex, '______');
    
    // If no replacement was made, try without word boundaries (in case word has punctuation)
    if (result === sentence) {
      const simpleRegex = new RegExp(escapedWord, 'gi');
      return sentence.replace(simpleRegex, '______');
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl text-black">Generating sentence...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] p-8">
        <button
          onClick={() => navigate('/guided-reading')}
          className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
        >
          BACK
        </button>
        
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-[#f37d59] text-white p-6 rounded-xl text-2xl font-bold text-center mb-6">
            {error}
          </div>
          <button
            onClick={() => generateNewSentence(sessionId)}
            className="w-full bg-[#0f606b] text-white py-4 rounded-xl text-2xl font-bold hover:bg-[#0a4a52] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate('/guided-reading')}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-4xl mx-auto mt-16">
        <h1 className="text-5xl font-bold text-center mb-8 text-black">
          Fill in the Blank
        </h1>
        
        <div className="bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl p-8 mb-6">
          <div className="text-4xl leading-relaxed text-black text-center mb-8">
            {getSentenceWithBlank()}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-2xl font-bold text-black mb-4">
                Select the correct word:
              </label>
              <select
                value={selectedWord}
                onChange={(e) => setSelectedWord(e.target.value)}
                disabled={disabled}
                className="w-full px-6 py-4 bg-white border-2 border-[#bdb091] rounded-2xl text-2xl text-black disabled:opacity-50"
              >
                <option value="">Choose a word...</option>
                {choices.map((choice, idx) => (
                  <option key={idx} value={choice.foreign}>
                    {choice.foreign} ({choice.english})
                  </option>
                ))}
              </select>
            </div>
            
            {feedback && (
              <div 
                className={`text-center mb-6 p-4 rounded-xl text-2xl font-bold text-white`}
                style={{ backgroundColor: feedback.color }}
              >
                {feedback.text}
              </div>
            )}
            
            <button
              type="submit"
              disabled={disabled || !selectedWord}
              className="w-full bg-[#0f606b] text-white py-4 rounded-xl text-2xl font-bold hover:bg-[#0a4a52] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          </form>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => generateNewSentence(sessionId)}
            className="bg-[#9b59b6] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#8e44ad] transition"
          >
            New Sentence
          </button>
        </div>
      </div>
    </div>
  );
}

