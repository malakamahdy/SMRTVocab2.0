import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { boldCurrentWords, parseBoldedText } from '../utils/wordBolding.jsx';

export default function ShortStoryPage() {
  const navigate = useNavigate();
  const [story, setStory] = useState('');
  const [currentWords, setCurrentWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
    generateStory(storedSessionId);
  }, [navigate]);

  const generateStory = async (sid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.generateShortStory(sid);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      
      if (result.success && result.text) {
        setStory(result.text);
        setCurrentWords(result.words || []);
      } else {
        setError('Failed to generate story');
      }
    } catch (err) {
      setError('Failed to generate story. Please try again.');
      console.error('Error generating story:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    generateStory(sessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl">Generating story...</div>
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
            onClick={handleRegenerate}
            className="w-full bg-[#0f606b] text-white py-4 rounded-xl text-2xl font-bold hover:bg-[#0a4a52] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const boldedText = boldCurrentWords(story, currentWords);
  const storyElements = parseBoldedText(boldedText);

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate('/guided-reading')}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-4xl mx-auto mt-16">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleRegenerate}
            className="bg-[#9b59b6] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#8e44ad] transition"
          >
            Generate New Story
          </button>
        </div>
        
        <div className="bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl p-8">
          <div className="text-3xl leading-relaxed text-black whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
            {storyElements}
          </div>
        </div>
      </div>
    </div>
  );
}

