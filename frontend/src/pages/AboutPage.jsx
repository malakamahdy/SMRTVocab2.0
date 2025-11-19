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
              This web-based version brings language learning to your browser, accessible anywhere. Study with multiple-choice 
              and text-input flashcards, review your known vocabulary, or explore our new <strong>Guided Reading</strong> mode—featuring 
              AI-generated short stories and topical passages that incorporate your learning words. All content is tailored to help 
              you see vocabulary in natural context while building real reading comprehension.
            </p>
            <p>
              Track your progress with detailed statistics, customize your learning experience with adjustable settings, and practice 
              pronunciation with text-to-speech. Currently supporting Spanish, with beta support for French, Arabic, and others.
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
              className="text-black text-2xl font-bold hover:underline"
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

