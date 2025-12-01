import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [instructorEmail, setInstructorEmail] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (storedRole !== 'Instructor' || !storedEmail) {
      navigate('/menu');
      return;
    }
    
    setInstructorEmail(storedEmail);
    loadAssignments();
  }, [code, navigate]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const result = await api.getClassroomAssignments(code);
      if (result.success) {
        setAssignments(result.assignments || []);
      } else {
        setError(result.error || 'Failed to load assignments');
      }
    } catch (err) {
      setError('Failed to load assignments');
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentStats = async (assignmentId) => {
    try {
      const result = await api.getAssignmentStats(assignmentId);
      if (result.success) {
        setAssignmentStats(result);
        setSelectedAssignment(assignmentId);
      }
    } catch (err) {
      console.error('Error loading assignment stats:', err);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await api.deleteAssignment(assignmentId, instructorEmail);
      if (result.success) {
        loadAssignments();
        setSelectedAssignment(null);
        setAssignmentStats(null);
      } else {
        alert(result.error || 'Failed to delete assignment');
      }
    } catch (err) {
      alert('Failed to delete assignment. Please try again.');
      console.error('Error deleting assignment:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf3dd] flex items-center justify-center">
        <div className="text-4xl text-black">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3dd] p-8">
      <button
        onClick={() => navigate(`/classroom/${code}`)}
        className="absolute top-4 left-4 bg-[#d9534f] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#c9433f] transition"
      >
        BACK
      </button>
      
      <div className="max-w-6xl mx-auto mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-bold text-black">Assignments</h1>
          <button
            onClick={() => navigate(`/classroom/${code}/create-assignment`)}
            className="bg-[#2ecc71] text-white px-6 py-3 rounded-xl text-xl font-bold hover:bg-[#27ae60] transition"
          >
            Create Assignment
          </button>
        </div>

        {error && (
          <div className="bg-[#f37d59] text-white p-4 rounded-xl text-xl font-bold text-center mb-6">
            {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <p className="text-2xl text-gray-600 py-8">
              No assignments yet. Create your first assignment to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.assignment_id} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-black mb-2">{assignment.assignment_name}</h3>
                    <div className="text-lg text-gray-600">
                      <span className="mr-4">Language: <strong>{assignment.language}</strong></span>
                      <span className="mr-4">Words: <strong>{assignment.word_count}</strong></span>
                      <span>Created: {new Date(assignment.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => loadAssignmentStats(assignment.assignment_id)}
                      className="bg-[#3498db] text-white px-6 py-2 rounded-lg text-lg font-bold hover:bg-[#2980b9] transition"
                    >
                      View Stats
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                      className="bg-[#e74c3c] text-white px-6 py-2 rounded-lg text-lg font-bold hover:bg-[#c0392b] transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Assignment Stats */}
                {selectedAssignment === assignment.assignment_id && assignmentStats && (
                  <div className="mt-6 pt-6 border-t-2 border-gray-300">
                    <h4 className="text-2xl font-bold text-black mb-4">Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{assignmentStats.total_students}</div>
                        <div className="text-sm text-gray-600">Total Students</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{assignmentStats.average_completion.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Avg Completion</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">{assignmentStats.average_accuracy.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Avg Accuracy</div>
                      </div>
                    </div>

                    {assignmentStats.student_stats && assignmentStats.student_stats.length > 0 && (
                      <div>
                        <h5 className="text-xl font-bold text-black mb-3">Student Progress</h5>
                        <div className="space-y-2">
                          {assignmentStats.student_stats.map((student, idx) => (
                            <div key={student.student_email} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-bold text-lg text-black">{student.student_email}</div>
                                  <div className="text-sm text-gray-600">
                                    Known: {student.known_count}/{assignmentStats.word_count} | 
                                    In Progress: {student.in_progress_count} | 
                                    Not Started: {student.not_started_count}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-black">{student.completion_percentage.toFixed(1)}%</div>
                                  <div className="text-sm text-gray-600">Accuracy: {student.accuracy.toFixed(1)}%</div>
                                </div>
                              </div>
                              <div className="mt-2 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${student.completion_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

