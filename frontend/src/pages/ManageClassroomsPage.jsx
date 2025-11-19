import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ManageClassroomsPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newClassroomCode, setNewClassroomCode] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (!storedUsername || storedRole !== 'Instructor') {
      navigate('/menu');
      return;
    }
    
    setUsername(storedUsername);
    loadClassrooms(storedUsername);
  }, [navigate, username]);

  const loadClassrooms = async (email) => {
    try {
      const result = await api.getInstructorClassrooms(email);
      if (result.success) {
        setClassrooms(result.classrooms || []);
      } else {
        setError(result.error || 'Failed to load classrooms');
      }
    } catch (err) {
      setError('Failed to load classrooms');
      console.error('Error loading classrooms:', err);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      setError('Please enter a classroom name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await api.createClassroom(className.trim(), username);
      if (result.success) {
        setNewClassroomCode(result.classroom_code);
        setClassName('');
        await loadClassrooms(username);
      } else {
        setError(result.error || 'Failed to create classroom');
      }
    } catch (err) {
      setError('Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert('Classroom code copied to clipboard!');
  };

  const viewClassroomDetails = async (classroomCode) => {
    setLoadingDashboard(true);
    setError('');
    
    try {
      // Load classroom details
      const classroomResult = await api.getClassroomDetails(classroomCode);
      if (classroomResult.success) {
        setSelectedClassroom(classroomResult);
      } else {
        setError(classroomResult.error || 'Failed to load classroom');
        setLoadingDashboard(false);
        return;
      }

      // Load dashboard stats
      const dashboardResult = await api.getInstructorDashboard(classroomCode);
      if (dashboardResult.success) {
        setDashboard(dashboardResult);
      } else {
        setError(dashboardResult.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to load classroom data');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const backToClassrooms = () => {
    setSelectedClassroom(null);
    setDashboard(null);
  };

  // If a classroom is selected, show details view
  if (selectedClassroom) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-6xl font-bold text-black mb-2">{selectedClassroom.name}</h1>
              <p className="text-2xl text-gray-700">
                Code: <strong className="text-3xl">{selectedClassroom.classroom_code}</strong>
                <button
                  onClick={() => copyCodeToClipboard(selectedClassroom.classroom_code)}
                  className="ml-4 bg-[#3498db] text-white px-4 py-2 rounded-lg text-lg font-bold hover:bg-[#2980b9] transition"
                >
                  Copy Code
                </button>
              </p>
            </div>
            <button
              onClick={backToClassrooms}
              className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
            >
              Back to Classrooms
            </button>
          </div>

          {error && (
            <div className="bg-yellow-500 text-white p-4 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {loadingDashboard ? (
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="text-2xl font-bold text-black">Loading classroom details...</div>
            </div>
          ) : (
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
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`text-4xl font-bold ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-600' :
                              index === 2 ? 'text-orange-600' :
                              'text-gray-500'
                            }`}>
                              #{student.rank}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-black mb-2">{student.student_email}</h3>
                              <div className="flex gap-4 text-lg text-gray-700 mb-2">
                                <span>Words Known: <strong>{student.total_known}</strong></span>
                                <span>Accuracy: <strong>{student.accuracy.toFixed(1)}%</strong></span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Correct: <strong>{student.total_correct}</strong> | Wrong: <strong>{student.total_incorrect}</strong> | Total Attempts: {student.total_seen}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/student-progress/${selectedClassroom.classroom_code}/${student.student_email}`)}
                            className="bg-[#9b59b6] text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-[#8e44ad] transition shadow-lg whitespace-nowrap"
                          >
                            View student progress
                          </button>
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
          )}
        </div>
      </div>
    );
  }

  // Show classroom list view
  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-bold text-black">Manage Classrooms</h1>
          <button
            onClick={() => navigate('/menu')}
            className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
          >
            Back to Menu
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {newClassroomCode && (
          <div className="bg-green-500 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Classroom Created!</h2>
            <p className="text-xl mb-4">Classroom Code: <strong>{newClassroomCode}</strong></p>
            <button
              onClick={() => copyCodeToClipboard(newClassroomCode)}
              className="bg-white text-green-500 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Copy Code
            </button>
          </div>
        )}

        {/* Create Classroom Section */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-4xl font-bold text-black mb-6">Create New Classroom</h2>
          <form onSubmit={handleCreateClassroom} className="space-y-4">
            <input
              type="text"
              placeholder="Classroom Name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl text-black"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3498db] text-white py-4 rounded-lg text-2xl font-bold hover:bg-[#2980b9] transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Classroom'}
            </button>
          </form>
        </div>

        {/* My Classrooms Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-4xl font-bold text-black mb-6">My Classrooms</h2>
          
          {classrooms.length === 0 ? (
            <p className="text-xl text-gray-600 text-center py-8">
              No classrooms yet. Create your first classroom above!
            </p>
          ) : (
            <div className="space-y-4">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.classroom_code}
                  className="border-2 border-gray-300 rounded-lg p-6 hover:border-[#3498db] transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-black mb-2">{classroom.name}</h3>
                      <p className="text-lg text-gray-700 mb-2">
                        Code: <strong className="text-2xl">{classroom.classroom_code}</strong>
                      </p>
                      <p className="text-lg text-gray-600">
                        Students: {classroom.member_count || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(classroom.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 ml-4">
                      <button
                        onClick={() => viewClassroomDetails(classroom.classroom_code)}
                        className="bg-[#0f606b] text-white px-8 py-3 rounded-lg text-xl font-bold hover:bg-[#0a4a52] transition shadow-lg"
                      >
                        View Details & Leaderboard
                      </button>
                      <button
                        onClick={() => copyCodeToClipboard(classroom.classroom_code)}
                        className="bg-[#3498db] text-white px-8 py-3 rounded-lg text-xl font-bold hover:bg-[#2980b9] transition shadow-lg"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

