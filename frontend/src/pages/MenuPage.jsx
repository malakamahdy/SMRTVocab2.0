import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function MenuPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role') || 'Student';
    if (!storedUsername) {
      navigate('/login');
      return;
    }
    
    setUsername(storedUsername);
    setRole(storedRole);
    // Initialize study session
    api.getSettings().then(settings => {
      api.initStudy(storedUsername, settings.language).then(result => {
        if (result.success) {
          setSessionId(result.session_id);
          localStorage.setItem('sessionId', result.session_id);
        }
      });
    });
  }, [navigate]);

  const handleExit = async () => {
    if (sessionId) {
      await api.saveSession(sessionId, username);
    }
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('sessionId');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-7xl font-bold text-center mb-12 text-black italic">
          Time to get SMRT!
        </h1>
        
        <div className="space-y-6">
          <button
            onClick={() => navigate('/choice')}
            className="w-full bg-[#f37d59] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#d9534f] transition"
          >
            Multiple Choice Flashcards
          </button>
          
          <button
            onClick={() => navigate('/text')}
            className="w-full bg-[#0f606b] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#0a4a52] transition"
          >
            Text-Input Flashcards
          </button>
          
          <button
            onClick={() => navigate('/review')}
            className="w-full bg-[#b69352] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#a08242] transition"
          >
            Review Mode
          </button>
          
          <button
            onClick={() => navigate('/guided-reading')}
            className="w-full bg-[#9b59b6] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#8e44ad] transition"
          >
            Guided Reading
          </button>
          
          <button
            onClick={() => navigate('/stats')}
            className="w-full bg-[#ffc24a] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#e6b042] transition"
          >
            Statistics
          </button>
          
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-[#aeb883] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#8f9d6f] transition"
          >
            Settings
          </button>

          {role === 'Instructor' && (
            <button
              onClick={() => navigate('/manage-classrooms')}
              className="w-full bg-[#3498db] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#2980b9] transition"
            >
              Manage Classrooms
            </button>
          )}

          {role === 'Student' && (
            <button
              onClick={() => navigate('/my-classroom')}
              className="w-full bg-[#3498db] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#2980b9] transition"
            >
              My Classroom
            </button>
          )}
        </div>
        
        <div className="flex justify-between mt-8">
          <button
            onClick={() => navigate('/about')}
            className="bg-[#e38368] text-white px-6 py-3 rounded-xl text-2xl font-bold hover:bg-[#d17256] transition"
          >
            About
          </button>
          
          <button
            onClick={handleExit}
            className="bg-[#d9534f] text-white px-6 py-3 rounded-xl text-2xl font-bold hover:bg-[#c9433f] transition"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

