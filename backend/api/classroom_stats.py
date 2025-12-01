from flask import Blueprint, request, jsonify
import csv
import os
import sys
import shutil
import logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import settings
from models.walking_window import WalkingWindow

logging.basicConfig(level=logging.INFO)

bp = Blueprint('classroom_stats', __name__, url_prefix='/api/classroom-stats')

MEMBERS_CSV = 'ClassroomMembers.csv'
CLASSROOMS_CSV = 'Classrooms.csv'

def ensure_user_csv_initialized(student_email, language):
    """Ensure a user's CSV file is initialized from template if it's empty or doesn't exist."""
    user_file = f"UserWords/{student_email}_{language}.csv"
    template_file = f"UserWords/Template_{language}.csv"
    
    # If file doesn't exist, copy from template
    if not os.path.exists(user_file):
        if os.path.exists(template_file):
            shutil.copy(template_file, user_file)
            return True
        return False
    
    # If file exists but is empty (only header), initialize from template
    try:
        with open(user_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            row_count = sum(1 for row in reader)
            if row_count == 0:  # Only header, no data rows
                if os.path.exists(template_file):
                    shutil.copy(template_file, user_file)
                    return True
    except Exception:
        # If there's an error reading, try to initialize from template
        if os.path.exists(template_file):
            shutil.copy(template_file, user_file)
            return True
    
    return False

def get_student_stats(student_email):
    """
    Calculate stats for a student across all languages.
    Returns: total_known, total_correct, total_incorrect, total_seen, accuracy
    """
    total_known = 0
    total_correct = 0
    total_incorrect = 0
    total_seen = 0
    
    # Normalize email (strip whitespace)
    student_email = student_email.strip()
    
    # Aggregate stats from all language CSV files
    for lang in settings.LANGUAGE_OPTIONS:
        # Ensure CSV is initialized if empty
        ensure_user_csv_initialized(student_email, lang)
        
        user_file = f"UserWords/{student_email}_{lang}.csv"
        if os.path.exists(user_file):
            try:
                row_count = 0
                words_with_progress = 0
                with open(user_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Skip empty rows
                        foreign_word = row.get('Foreign', '').strip()
                        if not foreign_word:
                            continue
                        
                        row_count += 1
                            
                        try:
                            seen = int(row.get('seen', 0) or 0)
                            correct = int(row.get('correct', 0) or 0)
                            wrong = int(row.get('wrong', 0) or 0)
                            known = bool(int(row.get('known', 0) or 0))
                            
                            if seen > 0 or correct > 0 or wrong > 0 or known:
                                words_with_progress += 1
                            
                            total_seen += seen
                            total_correct += correct
                            total_incorrect += wrong
                            if known:
                                total_known += 1
                        except (ValueError, KeyError, TypeError) as e:
                            # Log the error for debugging but continue processing
                            logging.warning(f"Error processing row for {student_email} {lang}: {e}, row: {row}")
                            continue
                
                logging.info(f"Stats for {student_email} {lang}: {row_count} words, {words_with_progress} with progress, known={total_known}, seen={total_seen}")
            except Exception as e:
                logging.error(f"Error reading {user_file} for {student_email}: {e}")
                continue
        else:
            logging.warning(f"CSV file not found: {user_file} for {student_email}")
    
    # Calculate accuracy percentage
    total_attempts = total_correct + total_incorrect
    accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0.0
    
    return {
        'total_known': total_known,
        'total_correct': total_correct,
        'total_incorrect': total_incorrect,
        'total_seen': total_seen,
        'accuracy': round(accuracy, 2)
    }

def get_classroom_instructor(classroom_code):
    """Get the instructor email for a classroom."""
    if os.path.exists(CLASSROOMS_CSV):
        with open(CLASSROOMS_CSV, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('classroom_code', '').strip().upper() == classroom_code.strip().upper():
                    return row.get('instructor_email', '').strip()
    return None

def get_classroom_students(classroom_code):
    """Get list of all students in a classroom (excluding the instructor)."""
    students = []
    instructor_email = get_classroom_instructor(classroom_code)
    if os.path.exists(MEMBERS_CSV):
        with open(MEMBERS_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                student_email = row.get('student_email', '').strip()
                classroom_code_row = row.get('classroom_code', '').strip().upper()
                if (classroom_code_row == classroom_code.strip().upper() and
                    student_email and
                    student_email != instructor_email):
                    students.append(student_email)
    return students

def calculate_classroom_leaderboard(code):
    """Calculate leaderboard for a classroom. Returns list of leaderboard entries."""
    code = code.strip().upper()
    students = get_classroom_students(code)
    
    if not students:
        return []
    
    # Calculate stats for each student
    leaderboard = []
    for student_email in students:
        stats = get_student_stats(student_email)
        leaderboard.append({
            'student_email': student_email,
            'total_known': stats['total_known'],
            'total_correct': stats['total_correct'],
            'total_incorrect': stats['total_incorrect'],
            'total_seen': stats['total_seen'],
            'accuracy': stats['accuracy']
        })
    
    # Sort by total_known (descending), then by accuracy (descending)
    leaderboard.sort(key=lambda x: (x['total_known'], x['accuracy']), reverse=True)
    
    # Add rank
    for i, entry in enumerate(leaderboard, start=1):
        entry['rank'] = i
    
    return leaderboard

@bp.route('/leaderboard/<code>', methods=['GET'])
def get_classroom_leaderboard(code):
    """Get leaderboard for a classroom sorted by total known words and accuracy."""
    if not code:
        return jsonify({'error': 'Classroom code is required!'}), 400
    
    leaderboard = calculate_classroom_leaderboard(code)
    return jsonify({'success': True, 'leaderboard': leaderboard})

@bp.route('/student/<code>/<email>', methods=['GET'])
def get_student_progress_in_classroom(code, email):
    """Get individual student stats for a specific classroom context."""
    if not code or not email:
        return jsonify({'error': 'Classroom code and student email are required!'}), 400
    
    code = code.strip().upper()
    email = email.strip()
    
    # Verify student is in classroom
    students = get_classroom_students(code)
    if email not in students:
        return jsonify({'error': 'Student is not a member of this classroom!'}), 404
    
    stats = get_student_stats(email)
    
    # Get leaderboard to find student's rank
    leaderboard = calculate_classroom_leaderboard(code)
    rank = next((entry['rank'] for entry in leaderboard if entry['student_email'] == email), None)
    if rank is not None:
        stats['rank'] = rank
    
    return jsonify({'success': True, 'stats': stats})

@bp.route('/dashboard/<code>', methods=['GET'])
def get_instructor_dashboard(code):
    """Get instructor dashboard with aggregate stats and individual student breakdowns."""
    if not code:
        return jsonify({'error': 'Classroom code is required!'}), 400
    
    code = code.strip().upper()
    students = get_classroom_students(code)
    
    if not students:
        return jsonify({
            'success': True,
            'total_students': 0,
            'average_known': 0,
            'average_accuracy': 0,
            'students': []
        })
    
    # Calculate stats for each student
    student_stats_list = []
    total_known_sum = 0
    total_accuracy_sum = 0
    
    for student_email in students:
        stats = get_student_stats(student_email)
        total_known_sum += stats['total_known']
        total_accuracy_sum += stats['accuracy']
        student_stats_list.append({
            'student_email': student_email,
            **stats
        })
    
    # Sort by total_known for dashboard display
    student_stats_list.sort(key=lambda x: x['total_known'], reverse=True)
    
    # Add rank
    for i, entry in enumerate(student_stats_list, start=1):
        entry['rank'] = i
    
    # Calculate averages
    num_students = len(students)
    average_known = round(total_known_sum / num_students, 2) if num_students > 0 else 0
    average_accuracy = round(total_accuracy_sum / num_students, 2) if num_students > 0 else 0
    
    return jsonify({
        'success': True,
        'total_students': num_students,
        'average_known': average_known,
        'average_accuracy': average_accuracy,
        'students': student_stats_list
    })

@bp.route('/student/<code>/<email>/walking-window', methods=['GET'])
def get_student_walking_window(code, email):
    """Get a student's walking window (current words being studied) for instructor view."""
    if not code or not email:
        return jsonify({'error': 'Classroom code and student email are required!'}), 400
    
    code = code.strip().upper()
    email = email.strip()
    
    # Verify student is in classroom
    students = get_classroom_students(code)
    if email not in students:
        return jsonify({'error': 'Student is not a member of this classroom!'}), 404
    
    # Get student's language setting - we'll check all languages or use default
    # For now, let's use the default language from settings
    language = request.args.get('language', settings.LANGUAGE)
    
    # Ensure CSV is initialized if empty
    ensure_user_csv_initialized(email, language)
    
    # Temporarily set the username and language for the walking window
    original_username = settings.username
    original_language = settings.LANGUAGE
    
    try:
        settings.username = email
        settings.LANGUAGE = language
        
        # Initialize walking window for this student
        walking_window = WalkingWindow(size=settings.WALKING_WINDOW_SIZE)
        
        # Get current words from walking window
        current_words = []
        for word in walking_window.current_words:
            current_words.append({
                'foreign': word.foreign,
                'english': word.english,
                'count_seen': word.count_seen,
                'count_correct': word.count_correct,
                'count_incorrect': word.count_incorrect,
                'is_known': word.is_known
            })
        
        # Also get SRS queue words
        srs_words = []
        for word in walking_window.srs_queue:
            srs_words.append({
                'foreign': word.foreign,
                'english': word.english,
                'count_seen': word.count_seen,
                'count_correct': word.count_correct,
                'count_incorrect': word.count_incorrect,
                'is_known': word.is_known
            })
        
    finally:
        # Restore original settings
        settings.username = original_username
        settings.LANGUAGE = original_language
    
    return jsonify({
        'success': True,
        'current_words': current_words,
        'srs_queue': srs_words,
        'walking_window_size': len(current_words),
        'srs_queue_size': len(srs_words),
        'language': language
    })

@bp.route('/student/<code>/<email>/all-words/<language>', methods=['GET'])
def get_student_all_words(code, email, language):
    """Get all words for a student in a specific language, categorized by known, learning, and struggling."""
    if not code or not email or not language:
        return jsonify({'error': 'Classroom code, student email, and language are required!'}), 400
    
    code = code.strip().upper()
    email = email.strip()
    
    # Verify student is in classroom
    students = get_classroom_students(code)
    if email not in students:
        return jsonify({'error': 'Student is not a member of this classroom!'}), 404
    
    if language not in settings.LANGUAGE_OPTIONS:
        return jsonify({'error': 'Invalid language!'}), 400
    
    # Ensure CSV is initialized if empty
    ensure_user_csv_initialized(email, language)
    
    user_file = f"UserWords/{email}_{language}.csv"
    
    known_words = []
    learning_words = []
    struggling_words = []
    
    if os.path.exists(user_file):
        try:
            with open(user_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Skip empty rows
                    if not row.get('Foreign', '').strip():
                        continue
                        
                    try:
                        foreign = row.get('Foreign', '').strip()
                        english = row.get('English', '').strip()
                        seen = int(row.get('seen', 0))
                        correct = int(row.get('correct', 0))
                        wrong = int(row.get('wrong', 0))
                        known = bool(int(row.get('known', 0)))
                        
                        word_data = {
                            'foreign': foreign,
                            'english': english,
                            'count_seen': seen,
                            'count_correct': correct,
                            'count_incorrect': wrong,
                            'is_known': known
                        }
                        
                        if known:
                            known_words.append(word_data)
                        elif wrong > correct and wrong > 2:  # Struggling: more wrong than correct and has multiple wrong attempts
                            struggling_words.append(word_data)
                        elif seen > 0:  # Learning: has been seen but not known
                            learning_words.append(word_data)
                    except (ValueError, KeyError):
                        continue
        except Exception as e:
            return jsonify({'error': f'Failed to read word data: {str(e)}'}), 500
    
    # Sort struggling words by wrong count (descending)
    struggling_words.sort(key=lambda x: x['count_incorrect'], reverse=True)
    
    # Sort learning words by seen count (descending)
    learning_words.sort(key=lambda x: x['count_seen'], reverse=True)
    
    # Sort known words alphabetically
    known_words.sort(key=lambda x: x['foreign'])
    
    return jsonify({
        'success': True,
        'language': language,
        'known_words': known_words,
        'learning_words': learning_words,
        'struggling_words': struggling_words,
        'total_known': len(known_words),
        'total_learning': len(learning_words),
        'total_struggling': len(struggling_words)
    })

@bp.route('/student/<code>/<email>/wordlist-stats/<language>', methods=['GET'])
def get_student_wordlist_stats(code, email, language):
    """Get student progress stats compared to the entire wordlist CSV for a specific language."""
    if not code or not email or not language:
        return jsonify({'error': 'Classroom code, student email, and language are required!'}), 400
    
    code = code.strip().upper()
    email = email.strip()
    
    # Verify student is in classroom
    students = get_classroom_students(code)
    if email not in students:
        return jsonify({'error': 'Student is not a member of this classroom!'}), 404
    
    if language not in settings.LANGUAGE_OPTIONS:
        return jsonify({'error': 'Invalid language!'}), 400
    
    # Ensure CSV is initialized if empty
    ensure_user_csv_initialized(email, language)
    
    # Count total words in the template wordlist
    template_file = f"UserWords/Template_{language}.csv"
    total_wordlist_words = 0
    
    if os.path.exists(template_file):
        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                total_wordlist_words = sum(1 for row in reader if row.get('Foreign', '').strip())
        except Exception as e:
            return jsonify({'error': f'Failed to read template wordlist: {str(e)}'}), 500
    else:
        return jsonify({'error': f'Template wordlist for {language} not found!'}), 404
    
    # Get student's word stats for this language
    user_file = f"UserWords/{email}_{language}.csv"
    student_known = 0
    student_total = 0
    student_seen = 0
    
    if os.path.exists(user_file):
        try:
            with open(user_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Skip empty rows
                    if not row.get('Foreign', '').strip():
                        continue
                        
                    try:
                        seen = int(row.get('seen', 0))
                        known = bool(int(row.get('known', 0)))
                        
                        student_total += 1
                        student_seen += seen
                        if known:
                            student_known += 1
                    except (ValueError, KeyError):
                        continue
        except Exception as e:
            return jsonify({'error': f'Failed to read student word data: {str(e)}'}), 500
    
    # Calculate progress percentage
    progress_percentage = (student_known / total_wordlist_words * 100) if total_wordlist_words > 0 else 0
    
    return jsonify({
        'success': True,
        'language': language,
        'total_wordlist_words': total_wordlist_words,
        'student_known': student_known,
        'student_total_in_csv': student_total,
        'student_seen': student_seen,
        'progress_percentage': round(progress_percentage, 2),
        'words_remaining': total_wordlist_words - student_known
    })