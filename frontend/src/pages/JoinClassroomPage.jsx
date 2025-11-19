import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function JoinClassroomPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  // Redirect if not a student
  if (role !== 'Student') {
    navigate('/menu');
    return null;
  }

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a classroom code');
      return;
    }

    if (!username) {
      setError('You must be logged in to join a classroom');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await api.joinClassroom(code.trim().toUpperCase(), username);
      if (result.success) {
        setSuccess(`Successfully joined ${result.classroom_name}!`);
        setCode('');
        // Redirect to My Classroom after 2 seconds
        setTimeout(() => {
          navigate('/my-classroom');
        }, 2000);
      } else {
        setError(result.error || 'Failed to join classroom');
      }
    } catch (err) {
      setError('Failed to join classroom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-bold text-black">Join Classroom</h1>
          <button
            onClick={() => navigate('/my-classroom')}
            className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
          >
            Back to My Classroom
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <p className="text-xl text-gray-700 mb-6">
            Enter the classroom code your instructor shared with you:
          </p>

          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500 text-white p-4 rounded-lg mb-6 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <input
              type="text"
              placeholder="Classroom Code (e.g., ABC123)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-2xl text-black text-center tracking-widest"
              maxLength={6}
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3498db] text-white py-4 rounded-lg text-2xl font-bold hover:bg-[#2980b9] transition disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Classroom'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              Don't have a classroom code? Ask your instructor to share one with you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

