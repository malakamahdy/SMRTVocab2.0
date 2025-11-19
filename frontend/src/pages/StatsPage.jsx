import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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

  // This function matches the original custom_function from StatsGUI.py
  // Formula: y = 114.4083 + (-1.124367 - 114.4083)/(1 + (x/616.4689)^0.7302358)
  const customFunction = (x) => {
    const y = 114.4083 + (-1.124367 - 114.4083) / (1 + Math.pow(x / 616.4689, 0.7302358));
    return Math.max(0, y);
  };

  if (!stats) {
    return <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
      <div className="text-4xl text-black">Loading...</div>
    </div>;
  }

  const userX = stats.total_known || 0;
  const userY = customFunction(userX);

  // Generate a table showing words to percentage mapping for reference
  const generateProgressTable = () => {
    const milestones = [
      { words: 0, label: '0' },
      { words: 500, label: '500' },
      { words: 1000, label: '1,000' },
      { words: 2000, label: '2,000' },
      { words: 3000, label: '3,000' },
      { words: 4000, label: '4,000' },
      { words: 5000, label: '5,000' }
    ];
    
    return milestones.map(milestone => ({
      words: milestone.words,
      label: milestone.label,
      percentage: customFunction(milestone.words).toFixed(1)
    }));
  };

  const progressTable = generateProgressTable();

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
            Total Known Words: {stats.total_known || 0}
          </div>
        </div>
        
        <div className="bg-[#0f606b] text-white p-6 rounded-2xl mb-6">
          <div className="text-2xl font-bold mb-2">Most Seen Word:</div>
          <div className="text-xl">{stats.most_difficult || 'N/A'}</div>
          <div className="text-2xl font-bold mt-4 mb-2">Worst Word:</div>
          <div className="text-xl">{stats.most_incorrect || 'N/A'}</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl mb-6">
          <h3 className="text-2xl font-bold mb-4 text-black text-center">Check your progress</h3>
          <div className="bg-[#f1dfb6] p-6 rounded-xl text-center">
            <div className="text-4xl font-bold text-black mb-2">
              {userX} words ~ {userY.toFixed(1)}% of Language Known
            </div>
            <div className="text-xl text-black mt-2">
              You are currently at approximately {userY.toFixed(1)}% language proficiency
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4 text-black text-center">Words to Percentage Reference</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f606b] text-white">
                  <th className="p-4 text-xl font-bold border border-[#0f606b]">Known Words</th>
                  <th className="p-4 text-xl font-bold border border-[#0f606b]">Percentage of Language</th>
                </tr>
              </thead>
              <tbody>
                {progressTable.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={row.words === userX ? 'bg-[#acb87c] text-white font-bold' : idx % 2 === 0 ? 'bg-[#f1dfb6]' : 'bg-white'}
                  >
                    <td className="p-4 text-xl border border-[#bdb091] text-black">{row.label}</td>
                    <td className="p-4 text-xl border border-[#bdb091] text-black">{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

