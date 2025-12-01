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
    if (!sid) {
      console.error('No session ID provided');
      return;
    }
    
    // Reset state before loading new word
    setDisabled(true);
    setFeedback(null);
    
    try {
      // Request 4 words, but handle cases where fewer are available
      const result = await api.getRandomWords(sid, 4);
      
      if (result.words && result.words.length > 0) {
        const [fw, ...rest] = result.words;
        
        // Build choices array
        let choices = [fw, ...rest];
        
        // For multiple choice, we need at least 2 options
        // If we only got 1 word, that's a problem (shouldn't happen)
        if (choices.length < 2) {
          setFeedback({ 
            text: 'Not enough words available for multiple choice mode.', 
            color: '#f37d59' 
          });
          setDisabled(false);
          return;
        }
        
        // If we have 2-3 words, that's fine - use what we have
        // The backend should try to get words from the entire assignment wordlist
        // if current_words doesn't have enough
        
        // Shuffle choices
        const shuffled = choices.sort(() => Math.random() - 0.5);
        
        // Update state
        setFlashword(fw);
        setChoices(shuffled);
        setDisabled(false);
      } else {
        // If no words returned, show error
        setFeedback({ 
          text: result?.error || 'No words available. Please check your word list.', 
          color: '#f37d59' 
        });
        setDisabled(false);
      }
    } catch (error) {
      console.error('Error loading new word:', error);
      setFeedback({ 
        text: 'Error loading word. Please try again.', 
        color: '#f37d59' 
      });
      setDisabled(false);
    }
  };

  const handleChoice = async (choice) => {
    if (disabled || !flashword || !choice) {
      console.warn('handleChoice called but disabled or missing data:', { disabled, flashword, choice });
      return;
    }
    
    setDisabled(true);
    
    console.log('Checking answer:', { 
      sessionId, 
      flashword: flashword.foreign, 
      answer: choice.english 
    });
    
    try {
      const result = await api.checkAnswer(sessionId, flashword, choice.english);
      
      console.log('Check answer result:', result);
      
      // Check if there's an error in the response
      if (result && result.error) {
        console.error('API error:', result.error);
        setFeedback({ 
          text: result.error || 'Error checking answer. Please try again.', 
          color: '#f37d59' 
        });
        setTimeout(() => {
          setFeedback(null);
          setDisabled(false);
        }, 2000);
        return;
      }
      
      // Check if we got a valid response with correct field
      if (result && typeof result.correct === 'boolean') {
        if (result.correct) {
          setFeedback({ text: 'Correct!', color: '#77721f' });
          setTimeout(() => {
            setFeedback(null);
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
            setFeedback(null);
            loadNewWord(sessionId);
          }, 2000);
        }
      } else {
        // Unexpected response format
        console.error('Unexpected response format:', result);
        setFeedback({ 
          text: 'Error checking answer. Please try again.', 
          color: '#f37d59' 
        });
        setTimeout(() => {
          setFeedback(null);
          setDisabled(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error in handleChoice:', error);
      setFeedback({ 
        text: 'Error checking answer. Please try again.', 
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

  const getBackPath = () => {
    const assignmentMode = localStorage.getItem('assignmentMode');
    if (assignmentMode === 'true') {
      const assignmentId = localStorage.getItem('assignmentId');
      return assignmentId ? `/assignment-study/${assignmentId}` : '/my-classroom';
    }
    return '/menu';
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
        onClick={() => navigate(getBackPath())}
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
        
        {choices.length > 0 && (
          <div className={`grid gap-6 ${
            choices.length === 2 ? 'grid-cols-2' : 
            choices.length === 3 ? 'grid-cols-3' : 
            'grid-cols-2'
          }`}>
            {choices.map((choice, idx) => (
              <button
                key={`${choice.foreign}-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleChoice(choice);
                }}
                disabled={disabled}
                className="bg-[#acb87c] text-white py-12 rounded-2xl text-3xl font-bold hover:bg-[#77721f] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {choice.english ? choice.english.toLowerCase() : 'Loading...'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

