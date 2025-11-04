import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
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
        <h1 className="text-7xl font-bold text-center mb-12 text-black">About Us</h1>
        
        <div className="bg-[#acb87c] text-white p-8 rounded-2xl">
          <div className="text-2xl space-y-4">
            <p>
              SMRT Vocab is the smarter way to learn a new language. Forget frustrating limits like health systems, 
              rigid lessons, or boring topics. Our powerful algorithm focuses on the most essential vocabulary—the words 
              you'll actually use.
            </p>
            <p>
              By closing the 'vocabulary gap,' SMRT Vocab helps you go beyond the basics and gain the confidence to enjoy 
              movies, books, and even conversations in your target language.
            </p>
            <p>
              No distractions. No limits. Just smarter learning. With SMRT Vocab, the world of language is yours to explore!
            </p>
          </div>
          
          <div className="mt-8 text-center">
            <a
              href="https://sites.google.com/view/smrt-vocab/home"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 text-2xl font-bold hover:underline"
            >
              Visit us!
            </a>
          </div>
          
          <div className="mt-8 text-right text-4xl italic text-[#fdf3dd]">
            - Lang Gang
          </div>
        </div>
      </div>
    </div>
  );
}

