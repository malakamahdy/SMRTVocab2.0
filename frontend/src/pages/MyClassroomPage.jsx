import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function MyClassroomPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [studentStats, setStudentStats] = useState({});
  const [assignments, setAssignments] = useState({});
  const [assignmentProgress, setAssignmentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (!storedUsername || storedRole !== 'Student') {
      navigate('/menu');
      return;
    }
    
    setUsername(storedUsername);
    loadClassroomData(storedUsername);
  }, [navigate, username]);

  const loadClassroomData = async (email) => {
    setLoading(true);
    setError('');
    
    try {
      // Load student's classrooms
      const classroomsResult = await api.getStudentClassrooms(email);
      if (classroomsResult.success) {
        const classroomsList = classroomsResult.classrooms || [];
        setClassrooms(classroomsList);
        
        // Load leaderboard and stats for each classroom
        const leaderboardPromises = {};
        const statsPromises = {};
        
        for (const classroom of classroomsList) {
          const code = classroom.classroom_code;
          leaderboardPromises[code] = api.getClassroomLeaderboard(code);
          statsPromises[code] = api.getStudentProgressInClassroom(code, email);
        }
        
        // Wait for all leaderboards
        const leaderboardResults = {};
        for (const [code, promise] of Object.entries(leaderboardPromises)) {
          try {
            const result = await promise;
            if (result.success) {
              leaderboardResults[code] = result.leaderboard || [];
            }
          } catch (err) {
            console.error(`Failed to load leaderboard for ${code}:`, err);
          }
        }
        setLeaderboards(leaderboardResults);
        
        // Wait for all stats
        const statsResults = {};
        for (const [code, promise] of Object.entries(statsPromises)) {
          try {
            const result = await promise;
            if (result.success) {
              statsResults[code] = result.stats || {};
            }
          } catch (err) {
            console.error(`Failed to load stats for ${code}:`, err);
          }
        }
        setStudentStats(statsResults);
        
        // Load assignments for each classroom
        const assignmentsResults = {};
        const progressResults = {};
        for (const classroom of classroomsList) {
          const code = classroom.classroom_code;
          try {
            const assignmentsResult = await api.getClassroomAssignments(code);
            if (assignmentsResult.success) {
              assignmentsResults[code] = assignmentsResult.assignments || [];
              
              // Load progress for each assignment
              for (const assignment of assignmentsResults[code]) {
                try {
                  const progressResult = await api.getStudentAssignmentProgress(assignment.assignment_id, email);
                  if (progressResult.success) {
                    if (!progressResults[code]) {
                      progressResults[code] = {};
                    }
                    progressResults[code][assignment.assignment_id] = progressResult;
                  }
                } catch (err) {
                  console.error(`Failed to load progress for assignment ${assignment.assignment_id}:`, err);
                }
              }
            }
          } catch (err) {
            console.error(`Failed to load assignments for ${code}:`, err);
          }
        }
        setAssignments(assignmentsResults);
        setAssignmentProgress(progressResults);
      } else {
        setError(classroomsResult.error || 'Failed to load classrooms');
      }
    } catch (err) {
      setError('Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  const getMyRank = (leaderboard) => {
    if (!leaderboard) return null;
    const myEntry = leaderboard.find(entry => entry.student_email === username);
    return myEntry ? myEntry.rank : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-bold text-black">My Classrooms</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/join-classroom')}
              className="bg-[#3498db] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#2980b9] transition"
            >
              Join Classroom
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="bg-[#0f606b] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#0a4a52] transition"
            >
              Back to Menu
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <h2 className="text-3xl font-bold text-black mb-4">No Classrooms Yet</h2>
            <p className="text-xl text-gray-600 mb-6">
              Join a classroom using a code from your instructor!
            </p>
            <button
              onClick={() => navigate('/join-classroom')}
              className="bg-[#3498db] text-white px-8 py-4 rounded-xl text-2xl font-bold hover:bg-[#2980b9] transition"
            >
              Join Classroom
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {classrooms.map((classroom) => {
              const code = classroom.classroom_code;
              const leaderboard = leaderboards[code] || [];
              const stats = studentStats[code] || {};
              const myRank = getMyRank(leaderboard);

              return (
                <div key={code} className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-4xl font-bold text-black mb-2">{classroom.name}</h2>
                      <p className="text-xl text-gray-700">
                        Code: <strong>{classroom.classroom_code}</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Joined: {new Date(classroom.joined_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* My Stats */}
                  <div className="bg-[#e8f4f8] rounded-xl p-6 mb-6">
                    <h3 className="text-2xl font-bold text-black mb-4">My Progress</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#3498db]">
                          {myRank ? `#${myRank}` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Rank</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#2ecc71]">
                          {stats.total_known || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Words Known</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#f39c12]">
                          {stats.accuracy ? `${stats.accuracy.toFixed(1)}%` : '0%'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#9b59b6]">
                          {stats.total_seen || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Attempts</div>
                      </div>
                    </div>
                  </div>

                  {/* Assignments */}
                  {assignments[code] && assignments[code].length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold text-black mb-4">Assignments</h3>
                      <div className="space-y-4">
                        {assignments[code].map((assignment) => {
                          const progress = assignmentProgress[code]?.[assignment.assignment_id];
                          const completion = progress?.completion_percentage || 0;
                          const status = completion === 100 ? 'completed' : 
                                       (completion > 0 ? 'in-progress' : 'not-started');
                          
                          return (
                            <div key={assignment.assignment_id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="text-2xl font-bold text-black">{assignment.assignment_name}</h4>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Language: {assignment.language} | Words: {assignment.word_count}
                                  </div>
                                </div>
                                <button
                                  onClick={() => navigate(`/assignment-study/${assignment.assignment_id}`)}
                                  className="bg-[#9b59b6] text-white px-6 py-2 rounded-lg text-lg font-bold hover:bg-[#8e44ad] transition"
                                >
                                  {status === 'completed' ? 'Review' : status === 'in-progress' ? 'Continue' : 'Start'}
                                </button>
                              </div>
                              
                              {progress && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-gray-700">
                                      Progress: {progress.known_count}/{progress.total_words} words known
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">
                                      {completion.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="bg-gray-200 rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full ${
                                        completion === 100 ? 'bg-green-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${completion}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                    <span>Known: {progress.known_count}</span>
                                    <span>In Progress: {progress.in_progress_count}</span>
                                    <span>Not Started: {progress.not_started_count}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  {leaderboard.length > 0 && (
                    <div>
                      <h3 className="text-3xl font-bold text-black mb-4">Leaderboard</h3>
                      <div className="space-y-3">
                        {leaderboard.slice(0, 10).map((entry, index) => {
                          const isMe = entry.student_email === username;
                          return (
                            <div
                              key={entry.student_email}
                              className={`border-2 rounded-lg p-4 ${
                                isMe
                                  ? 'border-[#3498db] bg-blue-50'
                                  : index === 0
                                  ? 'border-yellow-400 bg-yellow-50'
                                  : index === 1
                                  ? 'border-gray-300 bg-gray-50'
                                  : index === 2
                                  ? 'border-orange-300 bg-orange-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <div className={`text-2xl font-bold ${
                                    index === 0 ? 'text-yellow-600' :
                                    index === 1 ? 'text-gray-600' :
                                    index === 2 ? 'text-orange-600' :
                                    isMe ? 'text-[#3498db]' :
                                    'text-gray-500'
                                  }`}>
                                    #{entry.rank}
                                  </div>
                                  <div>
                                    <div className={`text-xl font-bold ${
                                      isMe ? 'text-[#3498db]' : 'text-black'
                                    }`}>
                                      {isMe ? `${entry.student_email} (You)` : entry.student_email}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      Words Known: {entry.total_known} | Accuracy: {entry.accuracy.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                                {isMe && (
                                  <div className="bg-[#3498db] text-white px-4 py-2 rounded-lg text-sm font-bold">
                                    YOU
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {leaderboard.length > 10 && (
                        <p className="text-center text-gray-600 mt-4">
                          Showing top 10. You are ranked #{myRank} out of {leaderboard.length} students.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

