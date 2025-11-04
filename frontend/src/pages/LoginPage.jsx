import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = isRegistering 
        ? await api.register(email, password)
        : await api.login(email, password);
      
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('username', result.username);
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
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl"
            required
          />
          
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
