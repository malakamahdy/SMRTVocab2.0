from flask import Blueprint, request, jsonify
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
    csv_path = 'AccountInformation.csv'
    
    if os.path.exists(csv_path):
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if email == row.get('Email') and password == row.get('Password'):
                    login_success = True
                    # Get role, default to 'Student' if not present (for backward compatibility)
                    user_role = row.get('Role', 'Student')
                    break
    
    if not login_success:
        return jsonify({'error': 'Incorrect email or password!'}), 401
    
    # Create user CSV files if necessary
    for lang in settings.LANGUAGE_OPTIONS:
        user_file = f"UserWords/{email}_{lang}.csv"
        if not os.path.exists(user_file):
            template = f"UserWords/Template_{lang}.csv"
            if os.path.exists(template):
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
    
    file_exists = os.path.exists(csv_path)
    with open(csv_path, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({'Email': email, 'Password': password, 'Role': role})
    
    for lang in settings.LANGUAGE_OPTIONS:
        template = f"UserWords/Template_{lang}.csv"
        user_file = f"UserWords/{email}_{lang}.csv"
        if os.path.exists(template):
            shutil.copy(template, user_file)
    
    return jsonify({'success': True, 'username': email, 'role': role})

