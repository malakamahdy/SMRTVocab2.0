import { useNavigate } from 'react-router-dom';

export default function GuidedReadingModePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate('/menu')}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-7xl font-bold text-center mb-12 text-black italic">
          Guided Reading
        </h1>
        
        <div className="space-y-6">
          <button
            onClick={() => navigate('/guided-reading/short-story')}
            className="w-full bg-[#9b59b6] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#8e44ad] transition"
          >
            Short Story Mode
          </button>
          
          <button
            onClick={() => navigate('/guided-reading/topical-passage')}
            className="w-full bg-[#3498db] text-white py-6 rounded-2xl text-4xl font-bold hover:bg-[#2980b9] transition"
          >
            Topical Passage Mode
          </button>
        </div>
      </div>
    </div>
  );
}

