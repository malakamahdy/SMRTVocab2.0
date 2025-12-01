import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function StudentProgressPage() {
  const navigate = useNavigate();
  const { code, studentEmail } = useParams();
  const [student, setStudent] = useState(null);
  const [walkingWindow, setWalkingWindow] = useState(null);
  const [allWords, setAllWords] = useState(null);
  const [wordlistStats, setWordlistStats] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    
    if (storedRole !== 'Instructor') {
      navigate('/menu');
      return;
    }

    if (code && studentEmail) {
      loadStudentData();
    }
  }, [code, studentEmail, selectedLanguage, navigate]);

  const loadStudentData = async () => {
    if (!code || !studentEmail) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Load student progress stats (aggregate across all languages)
      const progressResult = await api.getStudentProgressInClassroom(code, studentEmail);
      if (progressResult.success) {
        setStudent(progressResult.stats);
      } else {
        setError(progressResult.error || 'Failed to load student data');
      }

      // Load walking window for selected language
      const walkingWindowResult = await api.getStudentWalkingWindow(code, studentEmail, selectedLanguage);
      if (walkingWindowResult.success) {
        setWalkingWindow(walkingWindowResult);
      } else {
        console.error('Failed to load walking window:', walkingWindowResult.error);
      }

      // Load all words for the selected language
      const allWordsResult = await api.getStudentAllWords(code, studentEmail, selectedLanguage);
      if (allWordsResult.success) {
        setAllWords(allWordsResult);
      } else {
        console.error('Failed to load all words:', allWordsResult.error);
      }

      // Load wordlist stats (comparing to entire wordlist CSV) - only for Spanish
      if (selectedLanguage === 'Spanish') {
        const wordlistStatsResult = await api.getStudentWordlistStats(code, studentEmail, selectedLanguage);
        if (wordlistStatsResult.success) {
          setWordlistStats(wordlistStatsResult);
        } else {
          console.error('Failed to load wordlist stats:', wordlistStatsResult.error);
        }
      } else {
        setWordlistStats(null);
      }
    } catch (err) {
      setError('Failed to load student data');
      console.error('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl font-bold text-black">Loading student progress...</div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate(`/classroom/${code}`)}
            className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
          >
            Return to Class
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-6xl font-bold text-black mb-2">Student Progress</h1>
            <p className="text-2xl text-gray-700">{studentEmail}</p>
          </div>
          <button
            onClick={() => navigate(`/classroom/${code}`)}
            className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
          >
            Return to Class
          </button>
        </div>

        {error && (
          <div className="bg-yellow-500 text-white p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Student Stats Summary - Overall (All Languages) */}
        {student && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-4xl font-bold text-black mb-6">Overall Progress (All Languages)</h2>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-[#3498db] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">#{student.rank || 'N/A'}</div>
                <div className="text-lg mt-2">Rank</div>
              </div>
              <div className="bg-[#2ecc71] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{student.total_known || 0}</div>
                <div className="text-lg mt-2">Words Known</div>
              </div>
              <div className="bg-[#f39c12] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{student.accuracy?.toFixed(1) || 0}%</div>
                <div className="text-lg mt-2">Accuracy</div>
              </div>
              <div className="bg-[#9b59b6] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{student.total_seen || 0}</div>
                <div className="text-lg mt-2">Total Attempts</div>
              </div>
            </div>
          </div>
        )}

        {/* Spanish-Specific Stats Summary */}
        {allWords && selectedLanguage === 'Spanish' && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-4xl font-bold text-black mb-6">Spanish Progress</h2>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-[#2ecc71] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{allWords.total_known || 0}</div>
                <div className="text-lg mt-2">Words Known</div>
              </div>
              <div className="bg-[#f39c12] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{allWords.total_learning || 0}</div>
                <div className="text-lg mt-2">Words Learning</div>
              </div>
              <div className="bg-[#e74c3c] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{allWords.total_struggling || 0}</div>
                <div className="text-lg mt-2">Struggling Words</div>
              </div>
              <div className="bg-[#3498db] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">
                  {(allWords.total_known || 0) + (allWords.total_learning || 0) + (allWords.total_struggling || 0)}
                </div>
                <div className="text-lg mt-2">Total Studied</div>
              </div>
            </div>
          </div>
        )}

        {/* Wordlist CSV Stats (Spanish) */}
        {wordlistStats && selectedLanguage === 'Spanish' && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-4xl font-bold text-black mb-6">Spanish Wordlist Progress</h2>
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="bg-[#3498db] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{wordlistStats.total_wordlist_words || 0}</div>
                <div className="text-lg mt-2">Total Words in Wordlist</div>
              </div>
              <div className="bg-[#2ecc71] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{wordlistStats.student_known || 0}</div>
                <div className="text-lg mt-2">Words Known</div>
              </div>
              <div className="bg-[#e74c3c] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{wordlistStats.words_remaining || 0}</div>
                <div className="text-lg mt-2">Words Remaining</div>
              </div>
              <div className="bg-[#f39c12] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{wordlistStats.progress_percentage?.toFixed(1) || 0}%</div>
                <div className="text-lg mt-2">Progress</div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="text-lg text-gray-700 mb-2">
                <strong>Progress Bar:</strong>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-8 overflow-hidden">
                <div
                  className="bg-[#2ecc71] h-full flex items-center justify-center text-white font-bold transition-all duration-500"
                  style={{ width: `${Math.min(wordlistStats.progress_percentage || 0, 100)}%` }}
                >
                  {wordlistStats.progress_percentage > 5 && `${wordlistStats.progress_percentage.toFixed(1)}%`}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2 text-center">
                {wordlistStats.student_known || 0} of {wordlistStats.total_wordlist_words || 0} words mastered
              </div>
            </div>
          </div>
        )}

        {/* Language Selector */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <label className="text-2xl font-bold text-black mr-4">View Progress For Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-xl font-bold text-black bg-white"
          >
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="Arabic">Arabic</option>
            <option value="Japanese">Japanese</option>
            <option value="Mandarin">Mandarin</option>
            <option value="Hieroglyphic">Hieroglyphic</option>
          </select>
        </div>

        {/* Words Currently Learning (Walking Window) */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-4xl font-bold text-black mb-6">
            Currently Learning ({walkingWindow?.current_words?.length || 0} words) - {selectedLanguage}
          </h2>
          {walkingWindow && walkingWindow.current_words && walkingWindow.current_words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {walkingWindow.current_words.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4"
                >
                  <div className="font-bold text-lg text-black mb-1">
                    {word.foreign}
                  </div>
                  <div className="text-gray-700 mb-2 text-sm">{word.english}</div>
                  <div className="text-xs text-gray-600">
                    Seen: {word.count_seen} | ✓: {word.count_correct} | ✗: {word.count_incorrect}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xl">
              {walkingWindow ? 'No words currently in active learning' : 'Loading current words...'}
            </p>
          )}
        </div>

        {/* Struggling Words */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-4xl font-bold text-red-600 mb-6">
            Struggling Words ({allWords?.struggling_words?.length || 0}) - {selectedLanguage}
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Words with more incorrect attempts than correct attempts
          </p>
          {allWords && allWords.struggling_words && allWords.struggling_words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allWords.struggling_words.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-red-50 border-2 border-red-200 rounded-lg p-4"
                >
                  <div className="font-bold text-lg text-black mb-1">
                    {word.foreign}
                  </div>
                  <div className="text-gray-700 mb-2 text-sm">{word.english}</div>
                  <div className="text-xs text-gray-600">
                    Seen: {word.count_seen} | ✓: {word.count_correct} | ✗: <strong className="text-red-600">{word.count_incorrect}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xl">
              {allWords ? 'No struggling words' : 'Loading struggling words...'}
            </p>
          )}
        </div>

        {/* Learning Words (Seen but not known) */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-4xl font-bold text-yellow-600 mb-6">
            Words Being Learned ({allWords?.learning_words?.length || 0}) - {selectedLanguage}
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Words that have been studied but not yet mastered
          </p>
          {allWords && allWords.learning_words && allWords.learning_words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allWords.learning_words.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4"
                >
                  <div className="font-bold text-lg text-black mb-1">
                    {word.foreign}
                  </div>
                  <div className="text-gray-700 mb-2 text-sm">{word.english}</div>
                  <div className="text-xs text-gray-600">
                    Seen: {word.count_seen} | ✓: {word.count_correct} | ✗: {word.count_incorrect}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xl">
              {allWords ? 'No words being learned' : 'Loading learning words...'}
            </p>
          )}
        </div>

        {/* Known Words */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-4xl font-bold text-green-600 mb-6">
            Mastered Words ({allWords?.known_words?.length || 0}) - {selectedLanguage}
          </h2>
          {allWords && allWords.known_words && allWords.known_words.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {allWords.known_words.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
                >
                  <div className="font-bold text-lg text-black mb-1">
                    {word.foreign}
                  </div>
                  <div className="text-gray-700 mb-2 text-sm">{word.english}</div>
                  <div className="text-xs text-gray-600">
                    Seen: {word.count_seen} | ✓: {word.count_correct} | ✗: {word.count_incorrect}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xl">
              {allWords ? 'No mastered words yet' : 'Loading mastered words...'}
            </p>
          )}
        </div>

        {!loading && !walkingWindow && !allWords && (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <p className="text-2xl text-gray-600 py-8">
              No word data available for {selectedLanguage}. Student may not have started learning this language yet.
            </p>
          </div>
        )}

        {!loading && allWords && (!allWords.known_words || allWords.known_words.length === 0) && 
         (!allWords.learning_words || allWords.learning_words.length === 0) && 
         (!allWords.struggling_words || allWords.struggling_words.length === 0) && (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <p className="text-2xl text-gray-600 py-8">
              No word data available for {selectedLanguage}. Student may not have started learning this language yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

