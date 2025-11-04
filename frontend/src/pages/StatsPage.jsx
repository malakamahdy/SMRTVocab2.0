import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function StatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      navigate('/menu');
      return;
    }
    
    setSessionId(storedSessionId);
    loadStats(storedSessionId);
  }, [navigate]);

  const loadStats = async (sid) => {
    const result = await api.getStats(sid);
    if (result.total_known !== undefined) {
      setStats(result);
    }
  };

  const customFunction = (x) => {
    const y = 114.4083 + (-1.124367 - 114.4083) / (1 + Math.pow(x / 616.4689, 0.7302358));
    return Math.max(0, y);
  };

  const generateChartData = () => {
    const data = [];
    for (let x = 0; x <= 5000; x += 100) {
      data.push({
        words: x,
        percentage: customFunction(x)
      });
    }
    return data;
  };

  if (!stats) {
    return <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
      <div className="text-4xl">Loading...</div>
    </div>;
  }

  const chartData = generateChartData();
  const userX = stats.total_known;
  const userY = customFunction(userX);

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate('/menu')}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#acb87c] text-white p-8 rounded-2xl mb-6 text-center">
          <div className="text-6xl font-bold">
            Total Known Words: {stats.total_known}
          </div>
        </div>
        
        <div className="bg-[#0f606b] text-white p-6 rounded-2xl mb-6">
          <div className="text-2xl font-bold mb-2">Most Seen Word:</div>
          <div className="text-xl">{stats.most_difficult || 'N/A'}</div>
          <div className="text-2xl font-bold mt-4 mb-2">Worst Word:</div>
          <div className="text-xl">{stats.most_incorrect || 'N/A'}</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">Check your progress</h3>
          <LineChart width={800} height={400} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="words" label={{ value: 'Number of Known Words', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Percentage of Language Known', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="percentage" stroke="#4682b4" name="Language Knowledge Curve" />
            <Line 
              type="monotone" 
              dataKey="you" 
              stroke="#ff0000" 
              strokeDasharray="5 5" 
              name="You are here"
              data={[{ words: userX, you: userY }]}
            />
          </LineChart>
          <div className="text-center mt-4 text-xl">
            {userX} words ~ {userY.toFixed(0)} Percent
          </div>
        </div>
      </div>
    </div>
  );
}

