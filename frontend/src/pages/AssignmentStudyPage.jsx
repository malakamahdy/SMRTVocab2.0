import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function AssignmentStudyPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('Spanish');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (!storedUsername || storedRole !== 'Student') {
      navigate('/menu');
      return;
    }
    
    setUsername(storedUsername);
    loadAssignmentData(storedUsername);
  }, [assignmentId, navigate]);

  const loadAssignmentData = async (email) => {
    setLoading(true);
    setError('');
    
    try {
      // Load assignment details
      const assignmentResult = await api.getAssignmentDetails(assignmentId);
      if (assignmentResult.success) {
        setAssignment(assignmentResult);
        setLanguage(assignmentResult.language);
        
        // Load student progress
        const progressResult = await api.getStudentAssignmentProgress(assignmentId, email);
        if (progressResult.success) {
          setProgress(progressResult);
        }
        
        // Initialize study session
        const sessionResult = await api.initAssignmentStudy(email, assignmentResult.language, assignmentId);
        if (sessionResult.success) {
          setSessionId(sessionResult.session_id);
          localStorage.setItem('sessionId', sessionResult.session_id);
          localStorage.setItem('assignmentMode', 'true');
          localStorage.setItem('assignmentId', assignmentId);
        } else {
          setError(sessionResult.error || 'Failed to initialize study session');
        }
      } else {
        setError(assignmentResult.error || 'Failed to load assignment');
      }
    } catch (err) {
      setError('Failed to load assignment data');
      console.error('Error loading assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl text-black">Loading assignment...</div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] p-8">
        <button
          onClick={() => navigate('/my-classroom')}
          className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
        >
          BACK
        </button>
        
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-[#f37d59] text-white p-6 rounded-xl text-2xl font-bold text-center mb-6">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const completion = progress?.completion_percentage || 0;

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => {
          localStorage.removeItem('assignmentMode');
          localStorage.removeItem('assignmentId');
          navigate('/my-classroom');
        }}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-4xl mx-auto mt-16">
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <h1 className="text-5xl font-bold text-black mb-4">{assignment?.assignment_name}</h1>
          <div className="text-xl text-gray-700 mb-4">
            Language: <strong>{assignment?.language}</strong> | Words: <strong>{assignment?.word_count}</strong>
          </div>
          
          {progress && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-700">
                  Progress: {progress.known_count}/{progress.total_words} words known
                </span>
                <span className="text-2xl font-bold text-gray-700">
                  {completion.toFixed(1)}%
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    completion === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
              <div className="flex gap-6 mt-3 text-sm text-gray-600">
                <span>✓ Known: {progress.known_count}</span>
                <span>⟳ In Progress: {progress.in_progress_count}</span>
                <span>○ Not Started: {progress.not_started_count}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-black mb-6 text-center">Study Modes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/choice')}
              className="bg-[#f37d59] text-white py-6 rounded-2xl text-3xl font-bold hover:bg-[#d9534f] transition"
            >
              Multiple Choice Flashcards
            </button>
            
            <button
              onClick={() => navigate('/text')}
              className="bg-[#0f606b] text-white py-6 rounded-2xl text-3xl font-bold hover:bg-[#0a4a52] transition"
            >
              Text-Input Flashcards
            </button>
            
            <button
              onClick={() => navigate('/review')}
              className="bg-[#b69352] text-white py-6 rounded-2xl text-3xl font-bold hover:bg-[#a08242] transition"
            >
              Review Mode
            </button>
            
            <button
              onClick={() => navigate('/guided-reading')}
              className="bg-[#9b59b6] text-white py-6 rounded-2xl text-3xl font-bold hover:bg-[#8e44ad] transition"
            >
              Guided Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

