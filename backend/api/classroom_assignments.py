from flask import Blueprint, request, jsonify
import csv
import os
import uuid
from datetime import datetime
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from api.classrooms import CLASSROOMS_CSV, MEMBERS_CSV

bp = Blueprint('classroom_assignments', __name__, url_prefix='/api/classroom-assignments')

ASSIGNMENTS_CSV = 'ClassroomAssignments.csv'
ASSIGNMENT_WORDS_CSV = 'ClassroomAssignmentWords.csv'
ASSIGNMENT_PROGRESS_CSV = 'ClassroomAssignmentProgress.csv'

def get_classroom_instructor(classroom_code):
    """Get the instructor email for a classroom."""
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == classroom_code.strip().upper():
                    return row.get('instructor_email', '').strip()
    return None

def verify_instructor_access(classroom_code, instructor_email):
    """Verify that the instructor has access to this classroom."""
    instructor = get_classroom_instructor(classroom_code)
    return instructor and instructor.strip() == instructor_email.strip()

@bp.route('/create', methods=['POST'])
def create_assignment():
    """Create a new assignment for a classroom."""
    data = request.json
    classroom_code = data.get('classroom_code', '').strip().upper()
    assignment_name = data.get('assignment_name', '').strip()
    instructor_email = data.get('instructor_email', '').strip()
    language = data.get('language', '').strip()
    words = data.get('words', [])  # Array of {foreign, english}
    
    if not classroom_code or not assignment_name or not instructor_email or not language:
        return jsonify({'error': 'Classroom code, assignment name, instructor email, and language are required!'}), 400
    
    if not words or len(words) == 0:
        return jsonify({'error': 'At least one word is required!'}), 400
    
    # Verify instructor access
    if not verify_instructor_access(classroom_code, instructor_email):
        return jsonify({'error': 'You do not have permission to create assignments for this classroom!'}), 403
    
    # Generate unique assignment ID
    assignment_id = str(uuid.uuid4())
    created_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Write to ClassroomAssignments.csv
    file_exists = os.path.exists(ASSIGNMENTS_CSV)
    with open(ASSIGNMENTS_CSV, 'a', newline='') as f:
        fieldnames = ['assignment_id', 'classroom_code', 'assignment_name', 'instructor_email', 'language', 'created_date', 'is_active']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'assignment_id': assignment_id,
            'classroom_code': classroom_code,
            'assignment_name': assignment_name,
            'instructor_email': instructor_email,
            'language': language,
            'created_date': created_date,
            'is_active': '1'
        })
    
    # Write words to ClassroomAssignmentWords.csv
    words_file_exists = os.path.exists(ASSIGNMENT_WORDS_CSV)
    with open(ASSIGNMENT_WORDS_CSV, 'a', newline='') as f:
        fieldnames = ['assignment_id', 'foreign', 'english', 'word_order']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not words_file_exists:
            writer.writeheader()
        
        for idx, word in enumerate(words, start=1):
            if not word.get('foreign') or not word.get('english'):
                continue
            writer.writerow({
                'assignment_id': assignment_id,
                'foreign': word.get('foreign', '').strip(),
                'english': word.get('english', '').strip(),
                'word_order': idx
            })
    
    return jsonify({
        'success': True,
        'assignment_id': assignment_id,
        'assignment_name': assignment_name,
        'classroom_code': classroom_code,
        'language': language,
        'word_count': len(words),
        'created_date': created_date
    })

@bp.route('/classroom/<code>', methods=['GET'])
def get_classroom_assignments(code):
    """Get all assignments for a classroom."""
    if not code:
        return jsonify({'error': 'Classroom code is required!'}), 400
    
    code = code.strip().upper()
    assignments = []
    
    if os.path.exists(ASSIGNMENTS_CSV):
        with open(ASSIGNMENTS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == code:
                    assignment_id = row.get('assignment_id', '')
                    
                    # Count words in this assignment
                    word_count = 0
                    if os.path.exists(ASSIGNMENT_WORDS_CSV):
                        with open(ASSIGNMENT_WORDS_CSV, 'r') as wf:
                            word_reader = csv.DictReader(wf)
                            word_count = sum(1 for wrow in word_reader 
                                           if wrow.get('assignment_id', '') == assignment_id)
                    
                    assignments.append({
                        'assignment_id': assignment_id,
                        'assignment_name': row.get('assignment_name', ''),
                        'instructor_email': row.get('instructor_email', ''),
                        'language': row.get('language', ''),
                        'created_date': row.get('created_date', ''),
                        'is_active': row.get('is_active', '1') == '1',
                        'word_count': word_count
                    })
    
    # Sort by created_date (newest first)
    assignments.sort(key=lambda x: x['created_date'], reverse=True)
    
    return jsonify({'success': True, 'assignments': assignments})

@bp.route('/<assignment_id>', methods=['GET'])
def get_assignment_details(assignment_id):
    """Get assignment details and words."""
    if not assignment_id:
        return jsonify({'error': 'Assignment ID is required!'}), 400
    
    assignment = None
    if os.path.exists(ASSIGNMENTS_CSV):
        with open(ASSIGNMENTS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') == assignment_id:
                    assignment = row
                    break
    
    if not assignment:
        return jsonify({'error': 'Assignment not found!'}), 404
    
    # Get words for this assignment
    words = []
    if os.path.exists(ASSIGNMENT_WORDS_CSV):
        with open(ASSIGNMENT_WORDS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') == assignment_id:
                    words.append({
                        'foreign': row.get('foreign', ''),
                        'english': row.get('english', ''),
                        'word_order': int(row.get('word_order', 0))
                    })
    
    # Sort by word_order
    words.sort(key=lambda x: x['word_order'])
    
    return jsonify({
        'success': True,
        'assignment_id': assignment.get('assignment_id', ''),
        'assignment_name': assignment.get('assignment_name', ''),
        'classroom_code': assignment.get('classroom_code', ''),
        'instructor_email': assignment.get('instructor_email', ''),
        'language': assignment.get('language', ''),
        'created_date': assignment.get('created_date', ''),
        'is_active': assignment.get('is_active', '1') == '1',
        'words': words
    })

@bp.route('/<assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """Delete an assignment and all associated data."""
    if not assignment_id:
        return jsonify({'error': 'Assignment ID is required!'}), 400
    
    data = request.json
    instructor_email = data.get('instructor_email', '').strip()
    
    if not instructor_email:
        return jsonify({'error': 'Instructor email is required!'}), 400
    
    # Get assignment to verify ownership
    assignment = None
    if os.path.exists(ASSIGNMENTS_CSV):
        with open(ASSIGNMENTS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') == assignment_id:
                    assignment = row
                    break
    
    if not assignment:
        return jsonify({'error': 'Assignment not found!'}), 404
    
    # Verify instructor access
    if assignment.get('instructor_email', '').strip() != instructor_email:
        return jsonify({'error': 'You do not have permission to delete this assignment!'}), 403
    
    # Delete assignment from ClassroomAssignments.csv
    assignments = []
    if os.path.exists(ASSIGNMENTS_CSV):
        with open(ASSIGNMENTS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') != assignment_id:
                    assignments.append(row)
        
        with open(ASSIGNMENTS_CSV, 'w', newline='') as f:
            if assignments:
                fieldnames = ['assignment_id', 'classroom_code', 'assignment_name', 'instructor_email', 'language', 'created_date', 'is_active']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(assignments)
    
    # Delete words from ClassroomAssignmentWords.csv
    words = []
    if os.path.exists(ASSIGNMENT_WORDS_CSV):
        with open(ASSIGNMENT_WORDS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') != assignment_id:
                    words.append(row)
        
        with open(ASSIGNMENT_WORDS_CSV, 'w', newline='') as f:
            if words:
                fieldnames = ['assignment_id', 'foreign', 'english', 'word_order']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(words)
    
    # Delete progress from ClassroomAssignmentProgress.csv
    progress = []
    if os.path.exists(ASSIGNMENT_PROGRESS_CSV):
        with open(ASSIGNMENT_PROGRESS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') != assignment_id:
                    progress.append(row)
        
        with open(ASSIGNMENT_PROGRESS_CSV, 'w', newline='') as f:
            if progress:
                fieldnames = ['assignment_id', 'student_email', 'word_foreign', 'word_english', 'count_seen', 'count_correct', 'count_incorrect', 'is_known', 'last_updated']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(progress)
    
    return jsonify({'success': True, 'message': 'Assignment deleted successfully'})

@bp.route('/<assignment_id>/progress/<student_email>', methods=['GET'])
def get_student_assignment_progress(assignment_id, student_email):
    """Get a student's progress on a specific assignment."""
    if not assignment_id or not student_email:
        return jsonify({'error': 'Assignment ID and student email are required!'}), 400
    
    # Get assignment words
    assignment_words = []
    if os.path.exists(ASSIGNMENT_WORDS_CSV):
        with open(ASSIGNMENT_WORDS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') == assignment_id:
                    assignment_words.append({
                        'foreign': row.get('foreign', ''),
                        'english': row.get('english', '')
                    })
    
    if not assignment_words:
        return jsonify({'error': 'Assignment not found or has no words!'}), 404
    
    # Get student progress
    progress_dict = {}
    if os.path.exists(ASSIGNMENT_PROGRESS_CSV):
        with open(ASSIGNMENT_PROGRESS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if (row.get('assignment_id', '') == assignment_id and 
                    row.get('student_email', '').strip() == student_email.strip()):
                    word_key = f"{row.get('word_foreign', '')}|{row.get('word_english', '')}"
                    progress_dict[word_key] = {
                        'count_seen': int(row.get('count_seen', 0)),
                        'count_correct': int(row.get('count_correct', 0)),
                        'count_incorrect': int(row.get('count_incorrect', 0)),
                        'is_known': row.get('is_known', '0') == '1'
                    }
    
    # Build progress for each word
    words_progress = []
    known_count = 0
    in_progress_count = 0
    not_started_count = 0
    
    for word in assignment_words:
        word_key = f"{word['foreign']}|{word['english']}"
        progress = progress_dict.get(word_key, {
            'count_seen': 0,
            'count_correct': 0,
            'count_incorrect': 0,
            'is_known': False
        })
        
        words_progress.append({
            'foreign': word['foreign'],
            'english': word['english'],
            **progress
        })
        
        if progress['is_known']:
            known_count += 1
        elif progress['count_seen'] > 0:
            in_progress_count += 1
        else:
            not_started_count += 1
    
    total_words = len(assignment_words)
    completion_percentage = (known_count / total_words * 100) if total_words > 0 else 0
    
    return jsonify({
        'success': True,
        'assignment_id': assignment_id,
        'student_email': student_email,
        'total_words': total_words,
        'known_count': known_count,
        'in_progress_count': in_progress_count,
        'not_started_count': not_started_count,
        'completion_percentage': round(completion_percentage, 2),
        'words_progress': words_progress
    })

@bp.route('/<assignment_id>/stats', methods=['GET'])
def get_assignment_stats(assignment_id):
    """Get overall statistics for an assignment."""
    if not assignment_id:
        return jsonify({'error': 'Assignment ID is required!'}), 400
    
    # Get assignment details
    assignment = None
    if os.path.exists(ASSIGNMENTS_CSV):
        with open(ASSIGNMENTS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') == assignment_id:
                    assignment = row
                    break
    
    if not assignment:
        return jsonify({'error': 'Assignment not found!'}), 404
    
    classroom_code = assignment.get('classroom_code', '').strip().upper()
    
    # Get all students in the classroom
    students = []
    if os.path.exists(MEMBERS_CSV):
        with open(MEMBERS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == classroom_code:
                    students.append(row.get('student_email', '').strip())
    
    # Get assignment words count
    word_count = 0
    if os.path.exists(ASSIGNMENT_WORDS_CSV):
        with open(ASSIGNMENT_WORDS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            word_count = sum(1 for row in reader if row.get('assignment_id', '') == assignment_id)
    
    # Calculate stats for each student
    student_stats = []
    total_completion_sum = 0
    total_accuracy_sum = 0
    
    # Get progress for each student
    progress_dict = {}
    if os.path.exists(ASSIGNMENT_PROGRESS_CSV):
        with open(ASSIGNMENT_PROGRESS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('assignment_id', '') == assignment_id:
                    student_email = row.get('student_email', '').strip()
                    if student_email in students:
                        if student_email not in progress_dict:
                            progress_dict[student_email] = {
                                'words': {},
                                'total_correct': 0,
                                'total_incorrect': 0
                            }
                        
                        word_key = f"{row.get('word_foreign', '')}|{row.get('word_english', '')}"
                        if word_key not in progress_dict[student_email]['words']:
                            progress_dict[student_email]['words'][word_key] = {
                                'count_seen': 0,
                                'count_correct': 0,
                                'count_incorrect': 0,
                                'is_known': False
                            }
                        
                        word_progress = progress_dict[student_email]['words'][word_key]
                        word_progress['count_seen'] += int(row.get('count_seen', 0))
                        word_progress['count_correct'] += int(row.get('count_correct', 0))
                        word_progress['count_incorrect'] += int(row.get('count_incorrect', 0))
                        if row.get('is_known', '0') == '1':
                            word_progress['is_known'] = True
                        
                        progress_dict[student_email]['total_correct'] += int(row.get('count_correct', 0))
                        progress_dict[student_email]['total_incorrect'] += int(row.get('count_incorrect', 0))
    
    for student_email in students:
        student_progress = progress_dict.get(student_email, {'words': {}, 'total_correct': 0, 'total_incorrect': 0})
        
        known_count = sum(1 for w in student_progress['words'].values() if w['is_known'])
        in_progress_count = sum(1 for w in student_progress['words'].values() if w['count_seen'] > 0 and not w['is_known'])
        not_started_count = word_count - known_count - in_progress_count
        
        completion_percentage = (known_count / word_count * 100) if word_count > 0 else 0
        
        total_attempts = student_progress['total_correct'] + student_progress['total_incorrect']
        accuracy = (student_progress['total_correct'] / total_attempts * 100) if total_attempts > 0 else 0
        
        student_stats.append({
            'student_email': student_email,
            'completion_percentage': round(completion_percentage, 2),
            'known_count': known_count,
            'in_progress_count': in_progress_count,
            'not_started_count': not_started_count,
            'total_correct': student_progress['total_correct'],
            'total_incorrect': student_progress['total_incorrect'],
            'accuracy': round(accuracy, 2)
        })
        
        total_completion_sum += completion_percentage
        total_accuracy_sum += accuracy
    
    # Calculate averages
    num_students = len(student_stats)
    average_completion = round(total_completion_sum / num_students, 2) if num_students > 0 else 0
    average_accuracy = round(total_accuracy_sum / num_students, 2) if num_students > 0 else 0
    
    # Sort by completion percentage (descending)
    student_stats.sort(key=lambda x: x['completion_percentage'], reverse=True)
    
    return jsonify({
        'success': True,
        'assignment_id': assignment_id,
        'assignment_name': assignment.get('assignment_name', ''),
        'classroom_code': classroom_code,
        'language': assignment.get('language', ''),
        'word_count': word_count,
        'total_students': num_students,
        'average_completion': average_completion,
        'average_accuracy': average_accuracy,
        'student_stats': student_stats
    })

@bp.route('/<assignment_id>/student/<email>/details', methods=['GET'])
def get_student_assignment_details(assignment_id, email):
    """Get detailed student progress on an assignment."""
    return get_student_assignment_progress(assignment_id, email)

