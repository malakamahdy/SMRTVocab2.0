import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { boldCurrentWords, parseBoldedText } from '../utils/wordBolding.jsx';

export default function TopicalPassagePage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [passage, setPassage] = useState('');
  const [currentWords, setCurrentWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
  }, [navigate]);

  const generatePassage = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.generateTopicalPassage(sessionId, topic.trim());
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      
      if (result.success && result.text) {
        setPassage(result.text);
        setCurrentWords(result.words || []);
      } else {
        setError('Failed to generate passage');
      }
    } catch (err) {
      setError('Failed to generate passage. Please try again.');
      console.error('Error generating passage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (topic.trim()) {
      generatePassage({ preventDefault: () => {} });
    }
  };

  const boldedText = passage ? boldCurrentWords(passage, currentWords) : '';
  const passageElements = passage ? parseBoldedText(boldedText) : null;

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
          Topical Passage
        </h1>
        
        <form onSubmit={generatePassage} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., space travel, cooking, history)"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl text-2xl text-black disabled:opacity-50"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="bg-[#3498db] text-white px-8 py-4 rounded-2xl text-2xl font-bold hover:bg-[#2980b9] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="bg-[#f37d59] text-white p-4 rounded-xl text-xl font-bold text-center mb-6">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="text-center text-4xl py-12">
            Generating passage...
          </div>
        )}
        
        {passage && !loading && (
          <>
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleRegenerate}
                disabled={!topic.trim()}
                className="bg-[#3498db] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#2980b9] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Regenerate
              </button>
            </div>
            
            <div className="bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl p-8">
              <div className="text-3xl leading-relaxed text-black whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                {passageElements}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

