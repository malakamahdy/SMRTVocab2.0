import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function CreateAssignmentPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [assignmentName, setAssignmentName] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [words, setWords] = useState([{ foreign: '', english: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [instructorEmail, setInstructorEmail] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (storedRole !== 'Instructor' || !storedEmail) {
      navigate('/menu');
      return;
    }
    
    setInstructorEmail(storedEmail);
  }, [navigate]);

  const addWord = () => {
    setWords([...words, { foreign: '', english: '' }]);
  };

  const removeWord = (index) => {
    if (words.length > 1) {
      setWords(words.filter((_, i) => i !== index));
    }
  };

  const updateWord = (index, field, value) => {
    const updatedWords = [...words];
    updatedWords[index][field] = value;
    setWords(updatedWords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!assignmentName.trim()) {
      setError('Assignment name is required');
      return;
    }
    
    // Filter out empty words
    const validWords = words.filter(w => w.foreign.trim() && w.english.trim());
    
    if (validWords.length === 0) {
      setError('At least one word is required');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await api.createAssignment(
        code,
        assignmentName.trim(),
        instructorEmail,
        language,
        validWords
      );
      
      if (result.error) {
        setError(result.error);
      } else {
        navigate(`/classroom/${code}`);
      }
    } catch (err) {
      setError('Failed to create assignment. Please try again.');
      console.error('Error creating assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate(`/classroom/${code}`)}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-4xl mx-auto mt-16">
        <h1 className="text-6xl font-bold text-center mb-8 text-black">
          Create Assignment
        </h1>
        
        {error && (
          <div className="bg-[#f37d59] text-white p-4 rounded-xl text-xl font-bold text-center mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mb-6">
            <label className="block text-2xl font-bold text-black mb-3">
              Assignment Name
            </label>
            <input
              type="text"
              value={assignmentName}
              onChange={(e) => setAssignmentName(e.target.value)}
              disabled={loading}
              className="w-full px-6 py-4 bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl text-2xl text-black disabled:opacity-50"
              placeholder="Enter assignment name"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-2xl font-bold text-black mb-3">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className="w-full px-6 py-4 bg-[#f1dfb6] border-2 border-[#bdb091] rounded-2xl text-2xl text-black disabled:opacity-50"
            >
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Arabic">Arabic</option>
              <option value="Japanese">Japanese</option>
              <option value="Mandarin">Mandarin</option>
              <option value="Hieroglyphic">Hieroglyphic</option>
              <option value="TokiPona">TokiPona</option>
            </select>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="text-2xl font-bold text-black">
                Words
              </label>
              <button
                type="button"
                onClick={addWord}
                disabled={loading}
                className="bg-[#2ecc71] text-white px-6 py-2 rounded-xl text-lg font-bold hover:bg-[#27ae60] transition disabled:opacity-50"
              >
                Add Word
              </button>
            </div>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {words.map((word, index) => (
                <div key={index} className="flex gap-4 items-center bg-[#f1dfb6] p-4 rounded-xl">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={word.foreign}
                      onChange={(e) => updateWord(index, 'foreign', e.target.value)}
                      disabled={loading}
                      placeholder="Foreign word"
                      className="w-full px-4 py-2 bg-white border-2 border-[#bdb091] rounded-lg text-xl text-black disabled:opacity-50 mb-2"
                      required
                    />
                    <input
                      type="text"
                      value={word.english}
                      onChange={(e) => updateWord(index, 'english', e.target.value)}
                      disabled={loading}
                      placeholder="English translation"
                      className="w-full px-4 py-2 bg-white border-2 border-[#bdb091] rounded-lg text-xl text-black disabled:opacity-50"
                      required
                    />
                  </div>
                  {words.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWord(index)}
                      disabled={loading}
                      className="bg-[#e74c3c] text-white px-4 py-2 rounded-lg text-lg font-bold hover:bg-[#c0392b] transition disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f606b] text-white py-4 rounded-xl text-2xl font-bold hover:bg-[#0a4a52] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
}

