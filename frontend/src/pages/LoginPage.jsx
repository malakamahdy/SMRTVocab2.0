import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = isRegistering 
        ? await api.register(email, password, role)
        : await api.login(email, password);
      
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('username', result.username);
        localStorage.setItem('role', result.role || role);
        navigate('/menu');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h1 className="text-6xl font-bold text-center mb-8 text-black">
          Welcome to SMRT Vocab
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl text-black"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl text-black"
            required
          />
          
          {isRegistering && (
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-black">I am a:</label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="Student"
                    checked={role === 'Student'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-lg text-black">Student</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="Instructor"
                    checked={role === 'Instructor'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-lg text-black">Instructor</span>
                </label>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-[#acb87c] text-white py-4 rounded-lg text-2xl font-bold hover:bg-[#77721f] transition"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full mt-4 bg-[#0f606b] text-white py-4 rounded-lg text-2xl font-bold hover:bg-[#0a4a52] transition"
        >
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
