from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import os
import csv
from datetime import datetime, timedelta
import hashlib
import secrets
import random

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# 确保study_data目录存在
STUDY_DATA_DIR = 'study_data'
os.makedirs(STUDY_DATA_DIR, exist_ok=True)

# 用户数据文件
USERS_FILE = os.path.join(STUDY_DATA_DIR, 'users.csv')

# 初始化用户数据文件
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['username', 'password_hash'])

# 数据文件路径函数
def get_study_data_file(username):
    return os.path.join(STUDY_DATA_DIR, f'{username}_study_data.csv')

# 初始化学习数据文件
def init_study_data_file(username):
    file_path = get_study_data_file(username)
    if not os.path.exists(file_path):
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['subject', 'start_time', 'end_time', 'duration_minutes', 'date'])

# 密码哈希函数
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# 验证用户
def verify_user(username, password):
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # 跳过表头
        for row in reader:
            if row[0] == username and row[1] == hash_password(password):
                return True
    return False

# 检查用户是否存在
def user_exists(username):
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # 跳过表头
        for row in reader:
            if row[0] == username:
                return True
    return False

# 添加新用户
def add_user(username, password):
    with open(USERS_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([username, hash_password(password)])
    init_study_data_file(username)

# 记录学习开始
def start_study(username, subject):
    session['study_start_time'] = datetime.now().isoformat()
    session['current_subject'] = subject

# 记录学习结束
def end_study(username):
    if 'study_start_time' not in session or 'current_subject' not in session:
        return None
    
    start_time = datetime.fromisoformat(session['study_start_time'])
    end_time = datetime.now()
    subject = session['current_subject']
    duration = (end_time - start_time).total_seconds() / 60  # 转换为分钟
    
    # 保存到CSV
    file_path = get_study_data_file(username)
    with open(file_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            subject,
            start_time.strftime('%Y-%m-%d %H:%M:%S'),
            end_time.strftime('%Y-%m-%d %H:%M:%S'),
            round(duration, 2),
            start_time.strftime('%Y-%m-%d')
        ])
    
    # 清除会话
    session.pop('study_start_time', None)
    session.pop('current_subject', None)
    
    return {
        'subject': subject,
        'start_time': start_time,
        'end_time': end_time,
        'duration': round(duration, 2)
    }

# 获取今日学习数据
def get_today_study_data(username):
    today = datetime.now().strftime('%Y-%m-%d')
    file_path = get_study_data_file(username)
    data = []
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # 跳过表头
            for row in reader:
                if row[4] == today:
                    data.append({
                        'subject': row[0],
                        'start_time': row[1],
                        'end_time': row[2],
                        'duration': float(row[3])
                    })
    
    return data

# 获取所有学科列表
def get_subjects(username):
    file_path = get_study_data_file(username)
    subjects = set()
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # 跳过表头
            for row in reader:
                subjects.add(row[0])
    
    return list(subjects)

# 获取学科学习统计数据
def get_subject_stats(username, subject):
    file_path = get_study_data_file(username)
    total_duration = 0
    records = []
    date_stats = {}
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # 跳过表头
            for row in reader:
                if row[0] == subject:
                    duration = float(row[3])
                    total_duration += duration
                    records.append({
                        'start_time': row[1],
                        'end_time': row[2],
                        'duration': duration,
                        'date': row[4]
                    })
                    # 按日期统计
                    if row[4] in date_stats:
                        date_stats[row[4]] += duration
                    else:
                        date_stats[row[4]] = duration
    
    # 转换date_stats为列表格式
    date_list = [{'date': date, 'duration': round(duration, 2)} for date, duration in date_stats.items()]
    # 按日期排序
    date_list.sort(key=lambda x: x['date'], reverse=True)
    
    return {
        'subject': subject,
        'total_duration': round(total_duration, 2),
        'record_count': len(records),
        'date_stats': date_list,
        'records': sorted(records, key=lambda x: x['start_time'], reverse=True)
    }

@app.route('/')
def index():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    today_data = get_today_study_data(username)
    subjects = get_subjects(username)
    is_studying = 'study_start_time' in session
    current_subject = session.get('current_subject', '')
    start_time = session.get('study_start_time', '')
    
    return render_template('index.html', 
                          username=username,
                          today_data=today_data,
                          subjects=subjects,
                          is_studying=is_studying,
                          current_subject=current_subject,
                          start_time=start_time)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if verify_user(username, password):
            session['username'] = username
            return redirect(url_for('index'))
        else:
            flash('用户名或密码错误')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if user_exists(username):
            flash('用户名已存在')
        else:
            add_user(username, password)
            session['username'] = username
            return redirect(url_for('index'))
    
    return render_template('signup.html')

@app.route('/logout')
def logout():
    # 如果用户正在学习，先结束学习
    if 'username' in session and 'study_start_time' in session:
        end_study(session['username'])
    session.clear()
    return redirect(url_for('login'))

@app.route('/start_study', methods=['POST'])
def handle_start_study():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    subject = request.form['subject']
    if not subject:
        flash('请输入学科名称')
        return redirect(url_for('index'))
    
    start_study(session['username'], subject)
    return redirect(url_for('index'))

@app.route('/end_study')
def handle_end_study():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    result = end_study(session['username'])
    if result:
        flash(f'{result["subject"]} 学习结束，用时 {result["duration"]} 分钟')
    else:
        flash('没有正在进行的学习记录')
    
    return redirect(url_for('index'))

@app.route('/subject/<subject_name>')
def subject_detail(subject_name):
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    stats = get_subject_stats(username, subject_name)
    
    return render_template('subject_detail.html', 
                          username=username,
                          stats=stats)

@app.route('/get_random_color')
def get_random_color():
    # 生成随机的柔和颜色
    hue = random.randint(0, 360)
    saturation = random.randint(50, 70)  # 饱和度适中
    lightness = random.randint(70, 85)   # 亮度较高，使颜色柔和
    return jsonify({
        'color': f'hsl({hue}, {saturation}%, {lightness}%)',
        'text_color': 'black' if lightness > 75 else 'white'
    })

if __name__ == '__main__':
    # 使用Waitress作为WSGI服务器代替Flask开发服务器
    from waitress import serve
    host = '0.0.0.0'
    port = 5000
    print(f"Starting server with Waitress...")
    print(f" * Running on http://{host}:{port}/")
    print(f" * Running on http://localhost:{port}/")
    serve(app, host=host, port=port)