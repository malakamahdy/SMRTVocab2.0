from flask import Blueprint, request, jsonify
import csv
import os
import random
import string
from datetime import datetime
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

bp = Blueprint('classrooms', __name__, url_prefix='/api/classrooms')

CLASSROOMS_CSV = 'Classrooms.csv'
MEMBERS_CSV = 'ClassroomMembers.csv'

def generate_classroom_code():
    """Generate a unique 6-character alphanumeric classroom code."""
    characters = string.ascii_uppercase + string.digits
    code = ''.join(random.choice(characters) for _ in range(6))
    
    # Ensure uniqueness
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            existing_codes = {row.get('classroom_code', '') for row in reader}
            while code in existing_codes:
                code = ''.join(random.choice(characters) for _ in range(6))
    
    return code

@bp.route('/create', methods=['POST'])
def create_classroom():
    """Create a new classroom and return its code."""
    data = request.json
    name = data.get('name', '').strip()
    instructor_email = data.get('instructor_email', '').strip()
    
    if not name or not instructor_email:
        return jsonify({'error': 'Classroom name and instructor email are required!'}), 400
    
    code = generate_classroom_code()
    created_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Write to Classrooms.csv
    file_exists = os.path.exists(CLASSROOMS_CSV)
    with open(CLASSROOMS_CSV, 'a', newline='') as f:
        fieldnames = ['classroom_code', 'name', 'instructor_email', 'created_date']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'classroom_code': code,
            'name': name,
            'instructor_email': instructor_email,
            'created_date': created_date
        })
    
    return jsonify({
        'success': True,
        'classroom_code': code,
        'name': name,
        'instructor_email': instructor_email,
        'created_date': created_date
    })

@bp.route('/instructor/<email>', methods=['GET'])
def get_instructor_classrooms(email):
    """Get all classrooms created by an instructor."""
    if not email:
        return jsonify({'error': 'Instructor email is required!'}), 400
    
    classrooms = []
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('instructor_email', '').strip() == email:
                    # Count members for this classroom
                    member_count = 0
                    if os.path.exists(MEMBERS_CSV):
                        with open(MEMBERS_CSV, 'r') as mf:
                            member_reader = csv.DictReader(mf)
                            member_count = sum(1 for mrow in member_reader 
                                             if mrow.get('classroom_code', '').strip() == row.get('classroom_code', '').strip())
                    
                    classrooms.append({
                        'classroom_code': row.get('classroom_code', ''),
                        'name': row.get('name', ''),
                        'instructor_email': row.get('instructor_email', ''),
                        'created_date': row.get('created_date', ''),
                        'member_count': member_count
                    })
    
    return jsonify({'success': True, 'classrooms': classrooms})

@bp.route('/join', methods=['POST'])
def join_classroom():
    """Allow a student to join a classroom using a code."""
    data = request.json
    code = data.get('code', '').strip().upper()
    student_email = data.get('student_email', '').strip()
    
    if not code or not student_email:
        return jsonify({'error': 'Classroom code and student email are required!'}), 400
    
    # Validate classroom exists
    classroom = None
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == code:
                    classroom = row
                    break
    
    if not classroom:
        return jsonify({'error': 'Invalid classroom code!'}), 404
    
    # Prevent instructor from joining their own classroom
    instructor_email = classroom.get('instructor_email', '').strip()
    if student_email == instructor_email:
        return jsonify({'error': 'Instructors cannot join their own classrooms!'}), 400
    
    # Check if already a member
    if os.path.exists(MEMBERS_CSV):
        with open(MEMBERS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if (row.get('classroom_code', '').strip().upper() == code and 
                    row.get('student_email', '').strip() == student_email):
                    return jsonify({'error': 'You are already a member of this classroom!'}), 400
    
    # Add student to classroom
    joined_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    file_exists = os.path.exists(MEMBERS_CSV)
    with open(MEMBERS_CSV, 'a', newline='') as f:
        fieldnames = ['classroom_code', 'student_email', 'joined_date']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'classroom_code': code.upper(),
            'student_email': student_email,
            'joined_date': joined_date
        })
    
    return jsonify({
        'success': True,
        'classroom_name': classroom.get('name', ''),
        'classroom_code': code.upper(),
        'joined_date': joined_date
    })

@bp.route('/<code>', methods=['GET'])
def get_classroom_details(code):
    """Get details of a specific classroom."""
    if not code:
        return jsonify({'error': 'Classroom code is required!'}), 400
    
    code = code.strip().upper()
    classroom = None
    
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == code:
                    classroom = row
                    break
    
    if not classroom:
        return jsonify({'error': 'Classroom not found!'}), 404
    
    # Count members
    member_count = 0
    if os.path.exists(MEMBERS_CSV):
        with open(MEMBERS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            member_count = sum(1 for row in reader 
                             if row.get('classroom_code', '').strip().upper() == code)
    
    return jsonify({
        'success': True,
        'classroom_code': classroom.get('classroom_code', ''),
        'name': classroom.get('name', ''),
        'instructor_email': classroom.get('instructor_email', ''),
        'created_date': classroom.get('created_date', ''),
        'member_count': member_count
    })

@bp.route('/<code>/members', methods=['GET'])
def get_classroom_members(code):
    """Get all members of a classroom."""
    if not code:
        return jsonify({'error': 'Classroom code is required!'}), 400
    
    code = code.strip().upper()
    members = []
    
    if os.path.exists(MEMBERS_CSV):
        with open(MEMBERS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == code:
                    members.append({
                        'student_email': row.get('student_email', ''),
                        'joined_date': row.get('joined_date', '')
                    })
    
    return jsonify({'success': True, 'members': members})

@bp.route('/student/<email>', methods=['GET'])
def get_student_classrooms(email):
    """Get all classrooms a student has joined."""
    if not email:
        return jsonify({'error': 'Student email is required!'}), 400
    
    classrooms = []
    student_classroom_codes = set()
    
    # Get all classroom codes the student has joined
    if os.path.exists(MEMBERS_CSV):
        with open(MEMBERS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('student_email', '').strip() == email:
                    student_classroom_codes.add(row.get('classroom_code', '').strip().upper())
    
    # Get classroom details for each code
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() in student_classroom_codes:
                    # Get joined date
                    joined_date = ''
                    if os.path.exists(MEMBERS_CSV):
                        with open(MEMBERS_CSV, 'r') as mf:
                            member_reader = csv.DictReader(mf)
                            for mrow in member_reader:
                                if (mrow.get('classroom_code', '').strip().upper() == row.get('classroom_code', '').strip().upper() and
                                    mrow.get('student_email', '').strip() == email):
                                    joined_date = mrow.get('joined_date', '')
                                    break
                    
                    classrooms.append({
                        'classroom_code': row.get('classroom_code', ''),
                        'name': row.get('name', ''),
                        'instructor_email': row.get('instructor_email', ''),
                        'created_date': row.get('created_date', ''),
                        'joined_date': joined_date
                    })
    
    return jsonify({'success': True, 'classrooms': classrooms})

