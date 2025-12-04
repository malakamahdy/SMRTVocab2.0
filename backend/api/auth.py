from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import csv
import os
import shutil
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import settings

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    
    if not email or not password:
        return jsonify({'error': 'Please complete all fields!'}), 400
    
    login_success = False
    user_role = None
    stored_password_hash = None
    csv_path = 'AccountInformation.csv'
    needs_password_update = False
    
    if os.path.exists(csv_path):
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if email == row.get('Email'):
                    stored_password_hash = row.get('Password', '')
                    # Check if password is hashed (werkzeug hashes start with pbkdf2: or scrypt:)
                    is_hashed = stored_password_hash.startswith('pbkdf2:') or stored_password_hash.startswith('scrypt:')
                    
                    if is_hashed:
                        # Verify hashed password
                        if check_password_hash(stored_password_hash, password):
                            login_success = True
                            user_role = row.get('Role', 'Student')
                            break
                    else:
                        # Backward compatibility: check plain text password
                        if password == stored_password_hash:
                            login_success = True
                            user_role = row.get('Role', 'Student')
                            # Mark for password update (hash the plain text password)
                            needs_password_update = True
                            break
    
    if not login_success:
        return jsonify({'error': 'Incorrect email or password!'}), 401
    
    # If password was plain text, update it to hashed version
    if needs_password_update:
        # Read all rows, update the password for this user, write back
        rows = []
        fieldnames = ['Email', 'Password', 'Role']
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or fieldnames
            for row in reader:
                if row.get('Email') == email:
                    row['Password'] = generate_password_hash(password)
                rows.append(row)
        
        with open(csv_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    # Create user CSV files if necessary
    for lang in settings.LANGUAGE_OPTIONS:
        user_file = f"UserWords/{email}_{lang}.csv"
        template = f"UserWords/Template_{lang}.csv"
        if not os.path.exists(user_file):
            # File doesn't exist, copy template
            if os.path.exists(template):
                shutil.copy(template, user_file)
        elif os.path.exists(template):
            # File exists but might be empty or corrupted, check if it's valid
            try:
                with open(user_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    row_count = sum(1 for row in reader)
                    # If file has only header or is empty, copy template
                    if row_count == 0:
                        shutil.copy(template, user_file)
            except (csv.Error, IOError, UnicodeDecodeError):
                # File is corrupted, copy template
                shutil.copy(template, user_file)
    
    return jsonify({'success': True, 'username': email, 'role': user_role})

@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'Student').strip()
    
    if not email or not password:
        return jsonify({'error': 'Please complete all fields!'}), 400
    
    # Validate role
    if role not in ['Student', 'Instructor']:
        return jsonify({'error': 'Invalid role. Must be Student or Instructor!'}), 400
    
    unallowed = "<>:\"/\\|?*"
    if any(c in email for c in unallowed):
        return jsonify({'error': 'Emails should not contain: < > : " / \\ | ? *'}), 400
    
    csv_path = 'AccountInformation.csv'
    
    # Check if file exists and read current fieldnames
    fieldnames = ['Email', 'Password', 'Role']
    if os.path.exists(csv_path):
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            # Check for existing email
            for row in reader:
                if row.get('Email') == email:
                    return jsonify({'error': 'That email is already in use!'}), 400
            # Get fieldnames from existing file (for backward compatibility)
            f.seek(0)
            existing_fieldnames = reader.fieldnames
            if existing_fieldnames:
                # Ensure Role is in fieldnames, add if missing
                if 'Role' not in existing_fieldnames:
                    fieldnames = list(existing_fieldnames) + ['Role']
                else:
                    fieldnames = existing_fieldnames
    
    # Hash the password before storing
    password_hash = generate_password_hash(password)
    
    file_exists = os.path.exists(csv_path)
    with open(csv_path, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({'Email': email, 'Password': password_hash, 'Role': role})
    
    for lang in settings.LANGUAGE_OPTIONS:
        template = f"UserWords/Template_{lang}.csv"
        user_file = f"UserWords/{email}_{lang}.csv"
        if os.path.exists(template):
            # Always copy template on registration (overwrite if exists)
            shutil.copy(template, user_file)
    
    return jsonify({'success': True, 'username': email, 'role': role})

