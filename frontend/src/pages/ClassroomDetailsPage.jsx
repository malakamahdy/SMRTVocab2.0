import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ClassroomDetailsPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    
    if (storedRole !== 'Instructor') {
      navigate('/menu');
      return;
    }

    loadClassroomData();
  }, [code, navigate]);

  const loadClassroomData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load classroom details
      const classroomResult = await api.getClassroomDetails(code);
      if (classroomResult.success) {
        setClassroom(classroomResult);
      } else {
        setError(classroomResult.error || 'Failed to load classroom');
        setLoading(false);
        return;
      }

      // Load dashboard stats
      const dashboardResult = await api.getInstructorDashboard(code);
      if (dashboardResult.success) {
        setDashboard(dashboardResult);
      } else {
        setError(dashboardResult.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (classroom?.classroom_code) {
      navigator.clipboard.writeText(classroom.classroom_code);
      alert('Classroom code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  if (error && !classroom) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/manage-classrooms')}
            className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
          >
            Back to Classrooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-6xl font-bold text-black mb-2">{classroom?.name}</h1>
            <p className="text-2xl text-gray-700">
              Code: <strong className="text-3xl">{classroom?.classroom_code}</strong>
              <button
                onClick={copyCodeToClipboard}
                className="ml-4 bg-[#3498db] text-white px-4 py-2 rounded-lg text-lg font-bold hover:bg-[#2980b9] transition"
              >
                Copy Code
              </button>
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/classroom/${code}/assignments`)}
              className="bg-[#2ecc71] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#27ae60] transition"
            >
              Assignments
            </button>
            <button
              onClick={() => navigate('/manage-classrooms')}
              className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
            >
              Back to Classrooms
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-500 text-white p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Dashboard Content */}
        <>
        {/* Dashboard Stats */}
        {dashboard && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-4xl font-bold text-black mb-6">Dashboard Statistics</h2>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-[#3498db] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{dashboard.total_students}</div>
                <div className="text-lg mt-2">Total Students</div>
              </div>
              <div className="bg-[#2ecc71] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{dashboard.average_known}</div>
                <div className="text-lg mt-2">Avg Words Known</div>
              </div>
              <div className="bg-[#f39c12] text-white p-6 rounded-xl text-center">
                <div className="text-3xl font-bold">{dashboard.average_accuracy.toFixed(1)}%</div>
                <div className="text-lg mt-2">Avg Accuracy</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {dashboard && dashboard.students && dashboard.students.length > 0 && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-4xl font-bold text-black mb-6">Leaderboard</h2>
            <div className="space-y-4">
              {dashboard.students.map((student, index) => (
                <div
                  key={student.student_email}
                  className={`border-2 rounded-lg p-6 ${
                    index === 0 ? 'border-yellow-400 bg-yellow-50' :
                    index === 1 ? 'border-gray-300 bg-gray-50' :
                    index === 2 ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        #{student.rank}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-black">{student.student_email}</h3>
                        <div className="flex gap-4 mt-2 text-lg text-gray-700">
                          <span>Words Known: <strong>{student.total_known}</strong></span>
                          <span>Accuracy: <strong>{student.accuracy.toFixed(1)}%</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-lg text-gray-600 text-right">
                        <div>Correct: <strong>{student.total_correct}</strong> | Wrong: <strong>{student.total_incorrect}</strong></div>
                        <div className="text-sm text-gray-500 mt-1">
                          Total Attempts: {student.total_seen}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/student-progress/${code}/${student.student_email}`)}
                        className="bg-[#9b59b6] text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-[#8e44ad] transition shadow-lg whitespace-nowrap"
                      >
                        View student progress
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dashboard && (!dashboard.students || dashboard.students.length === 0) && (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <p className="text-2xl text-gray-600 py-8">
              No students have joined this classroom yet. Share the classroom code with your students!
            </p>
          </div>
        )}
        </>
      </div>
    </div>
  );
}

