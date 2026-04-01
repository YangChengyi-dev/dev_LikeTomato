// 应用主逻辑

// 检查用户是否已登录
function checkLogin() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
        return false;
    }
    return username;
}

// 初始化应用
function initApp() {
    const username = checkLogin();
    if (!username) return;
    
    // 显示用户名
    document.getElementById('username-display').textContent = username;
    
    // 初始化时间显示
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 初始化签到状态
    initCheckinStatus();
    
    // 初始化学习状态
    initStudyStatus();
    
    // 加载今日学习记录
    loadTodayStudyRecords();
    
    // 加载学科列表
    loadSubjects();
    
    // 初始化图表
    initAllCharts();
    
    // 绑定事件
    bindEvents();
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        weekday: 'long'
    };
    document.getElementById('current-time').textContent = now.toLocaleString('zh-CN', options);
}

// 初始化签到状态
function initCheckinStatus() {
    const username = localStorage.getItem('username');
    const checkinData = getCheckinData(username);
    const today = getTodayDate();
    
    // 检查今日是否已签到
    const todayChecked = checkinData.some(record => record.date === today);
    
    if (todayChecked) {
        document.getElementById('checkin-section').innerHTML = `
            <div class="d-flex align-items-center">
                <div class="bg-success text-white p-3 rounded-full me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                    </svg>
                </div>
                <div>
                    <h5 class="mb-1">今日已签到</h5>
                    <p class="text-muted mb-0">感谢您的坚持！</p>
                </div>
            </div>
        `;
    } else {
        document.getElementById('checkin-btn').addEventListener('click', performCheckin);
    }
    
    // 更新签到统计
    updateCheckinStats();
}

// 执行签到
function performCheckin(e) {
    e.preventDefault();
    const username = localStorage.getItem('username');
    const today = getTodayDate();
    const now = new Date();
    const time = now.toTimeString().substring(0, 8);
    
    // 添加签到记录
    const checkinData = getCheckinData(username);
    checkinData.push({ date: today, time: time });
    localStorage.setItem(`${username}_checkin_data`, JSON.stringify(checkinData));
    
    // 更新签到状态
    initCheckinStatus();
    
    // 显示成功消息
    showMessage('签到成功！');
}

// 更新签到统计
function updateCheckinStats() {
    const username = localStorage.getItem('username');
    const checkinData = getCheckinData(username);
    
    // 计算累计签到天数
    const totalDays = checkinData.length;
    
    // 计算连续签到天数
    const consecutiveDays = calculateConsecutiveCheckinDays(checkinData);
    
    // 更新UI
    document.getElementById('total-checkin-days').textContent = totalDays;
    document.getElementById('consecutive-checkin-days').textContent = consecutiveDays;
}

// 计算连续签到天数
function calculateConsecutiveCheckinDays(checkinData) {
    if (checkinData.length === 0) return 0;
    
    // 按日期排序（从新到旧）
    const sortedDates = checkinData.map(record => record.date).sort((a, b) => new Date(b) - new Date(a));
    
    let consecutiveDays = 1;
    let currentDate = new Date(sortedDates[0]);
    
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i]);
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            consecutiveDays++;
            currentDate = prevDate;
        } else {
            break;
        }
    }
    
    return consecutiveDays;
}

// 初始化学习状态
function initStudyStatus() {
    const studyStartTime = localStorage.getItem('study_start_time');
    const currentSubject = localStorage.getItem('current_subject');
    
    if (studyStartTime && currentSubject) {
        // 显示正在学习状态
        document.getElementById('study-status-section').innerHTML = `
            <div class="current-study">
                <h4>🚀 正在学习: ${currentSubject}</h4>
                <p>已学习: <span id="study-duration">00:00:00</span></p>
                <a href="#" class="btn btn-danger mt-2" id="end-study-btn">停止学习</a>
            </div>
        `;
        
        // 更新学习时长
        updateStudyDuration();
        setInterval(updateStudyDuration, 1000);
        
        // 绑定停止学习事件
        document.getElementById('end-study-btn').addEventListener('click', endStudy);
    } else {
        // 绑定开始学习事件
        document.getElementById('start-study-form').addEventListener('submit', startStudy);
    }
}

// 开始学习
function startStudy(e) {
    e.preventDefault();
    const subject = document.getElementById('subject').value.trim();
    
    if (!subject) {
        showMessage('请输入学科名称', 'danger');
        return;
    }
    
    // 保存学习状态
    localStorage.setItem('study_start_time', new Date().toISOString());
    localStorage.setItem('current_subject', subject);
    
    // 重新初始化学习状态
    initStudyStatus();
    
    // 显示成功消息
    showMessage(`开始学习 ${subject}`);
}

// 结束学习
function endStudy(e) {
    e.preventDefault();
    const username = localStorage.getItem('username');
    const studyStartTime = localStorage.getItem('study_start_time');
    const currentSubject = localStorage.getItem('current_subject');
    
    if (!studyStartTime || !currentSubject) {
        showMessage('没有正在进行的学习记录', 'danger');
        return;
    }
    
    // 计算学习时长
    const startTime = new Date(studyStartTime);
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000 / 60; // 转换为分钟
    
    // 保存学习记录
    const studyData = getStudyData(username);
    studyData.push({
        subject: currentSubject,
        start_time: startTime.toLocaleString('zh-CN'),
        end_time: endTime.toLocaleString('zh-CN'),
        duration: Math.round(duration * 100) / 100,
        date: getTodayDate()
    });
    localStorage.setItem(`${username}_study_data`, JSON.stringify(studyData));
    
    // 清除学习状态
    localStorage.removeItem('study_start_time');
    localStorage.removeItem('current_subject');
    
    // 重新初始化学习状态
    initStudyStatus();
    
    // 重新加载数据
    loadTodayStudyRecords();
    loadSubjects();
    initAllCharts();
    
    // 显示成功消息
    showMessage(`${currentSubject} 学习结束，用时 ${Math.round(duration * 100) / 100} 分钟`);
}

// 更新学习时长
function updateStudyDuration() {
    const studyStartTime = localStorage.getItem('study_start_time');
    if (!studyStartTime) return;
    
    const startTime = new Date(studyStartTime);
    const now = new Date();
    const duration = Math.floor((now - startTime) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    const formattedTime = padZero(hours) + ':' + padZero(minutes) + ':' + padZero(seconds);
    document.getElementById('study-duration').textContent = formattedTime;
}

// 加载今日学习记录
function loadTodayStudyRecords() {
    const username = localStorage.getItem('username');
    const studyData = getStudyData(username);
    const today = getTodayDate();
    
    // 筛选今日记录
    const todayRecords = studyData.filter(record => record.date === today);
    
    if (todayRecords.length > 0) {
        let recordsHtml = '<div class="study-records">';
        let totalDuration = 0;
        
        todayRecords.forEach(record => {
            totalDuration += record.duration;
            recordsHtml += `
                <div class="study-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${record.subject}</strong>
                            <p class="text-muted mb-0">${record.start_time} - ${record.end_time}</p>
                        </div>
                        <span class="duration-badge">${record.duration} 分钟</span>
                    </div>
                </div>
            `;
        });
        
        recordsHtml += '</div>';
        recordsHtml += `
            <div class="mt-4">
                <h5>今日总学习时间：
                    <span class="badge bg-primary">
                        ${totalDuration.toFixed(2)} 分钟
                    </span>
                </h5>
            </div>
        `;
        
        document.getElementById('today-study-records').innerHTML = recordsHtml;
    } else {
        document.getElementById('today-study-records').innerHTML = `
            <div class="text-center text-muted py-4">
                <p>今天还没有学习记录</p>
            </div>
        `;
    }
}

// 加载学科列表
function loadSubjects() {
    const username = localStorage.getItem('username');
    const studyData = getStudyData(username);
    
    // 提取所有学科
    const subjects = [...new Set(studyData.map(record => record.subject))];
    
    if (subjects.length > 0) {
        document.getElementById('subjects-card').classList.remove('d-none');
        let subjectsHtml = '';
        
        subjects.forEach(subject => {
            // 生成随机颜色
            const hue = Math.floor(Math.random() * 360);
            const saturation = Math.floor(Math.random() * 21) + 50; // 50-70%
            const lightness = Math.floor(Math.random() * 16) + 70;  // 70-85%
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            const textColor = lightness > 75 ? 'black' : 'white';
            
            subjectsHtml += `
                <div class="d-flex gap-1 subject-wrapper">
                    <div class="badge py-2 px-3 subject-badge" data-subject="${subject}" style="background-color: ${color}; color: ${textColor}; border: none; transition: all 0.3s ease; text-decoration: none;">
                        ${subject}
                    </div>
                    <a href="#" class="badge bg-success py-2 px-2 start-study-btn" title="开始学习这门课" data-subject="${subject}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                        </svg>
                    </a>
                </div>
            `;
        });
        
        document.getElementById('subjects-container').innerHTML = subjectsHtml;
        
        // 绑定学科点击事件
        document.querySelectorAll('.start-study-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const subject = this.getAttribute('data-subject');
                startStudyWithSubject(subject);
            });
        });
    }
}

// 开始学习指定学科
function startStudyWithSubject(subject) {
    // 保存学习状态
    localStorage.setItem('study_start_time', new Date().toISOString());
    localStorage.setItem('current_subject', subject);
    
    // 重新初始化学习状态
    initStudyStatus();
    
    // 显示成功消息
    showMessage(`开始学习 ${subject}`);
}

// 初始化所有图表
function initAllCharts() {
    const username = localStorage.getItem('username');
    
    // 近1天统计
    const stats1day = getTimeRangeStats(username, 1);
    initDateChart('day1-date-chart', stats1day.date_stats);
    initSubjectChart('day1-subject-chart', stats1day.subject_stats);
    document.getElementById('day1-total-duration').textContent = stats1day.total_duration.toFixed(2) + ' 分钟';
    
    // 近7天统计
    const stats7days = getTimeRangeStats(username, 7);
    initDateChart('day7-date-chart', stats7days.date_stats);
    initSubjectChart('day7-subject-chart', stats7days.subject_stats);
    document.getElementById('day7-total-duration').textContent = stats7days.total_duration.toFixed(2) + ' 分钟';
    
    // 近30天统计
    const stats30days = getTimeRangeStats(username, 30);
    initDateChart('day30-date-chart', stats30days.date_stats);
    initSubjectChart('day30-subject-chart', stats30days.subject_stats);
    document.getElementById('day30-total-duration').textContent = stats30days.total_duration.toFixed(2) + ' 分钟';
}

// 初始化日期统计图表（折线图）
function initDateChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = Object.keys(data).sort();
    const durations = labels.map(date => data[date]);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '学习时间(分钟)',
                data: durations,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '分钟'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// 初始化学科统计图表（饼图）
function initSubjectChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = Object.keys(data);
    const durations = Object.values(data);
    
    // 如果没有数据，显示空状态
    if (labels.length === 0) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['暂无数据'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#f8f9fa'],
                    borderColor: ['#dee2e6'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
        return;
    }
    
    // 动态生成颜色
    const colors = generateColors(labels.length);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: durations,
                backgroundColor: colors.map(c => c.fill),
                borderColor: colors.map(c => c.border),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toFixed(1)}分钟 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 生成颜色数组
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 0.618033988749895 * 360) % 360;
        const saturation = 70 + (Math.sin(i * 2) * 10);
        const lightness = 45 + (Math.cos(i * 1.5) * 5);
        
        colors.push({
            fill: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`,
            border: `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`
        });
    }
    return colors;
}

// 获取时间范围内的学习统计数据
function getTimeRangeStats(username, days) {
    const studyData = getStudyData(username);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // 生成日期列表
    const dateList = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dateList.push(getDateString(date));
    }
    
    // 初始化统计数据
    const dateStats = {};
    dateList.forEach(date => {
        dateStats[date] = 0;
    });
    
    const subjectStats = {};
    let totalDuration = 0;
    
    // 统计数据
    studyData.forEach(record => {
        if (dateList.includes(record.date)) {
            dateStats[record.date] += record.duration;
            totalDuration += record.duration;
            
            if (!subjectStats[record.subject]) {
                subjectStats[record.subject] = 0;
            }
            subjectStats[record.subject] += record.duration;
        }
    });
    
    return {
        date_stats: dateStats,
        subject_stats: subjectStats,
        total_duration: totalDuration,
        days: days
    };
}

// 绑定事件
function bindEvents() {
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// 退出登录
function logout() {
    // 清除所有相关数据
    localStorage.removeItem('username');
    localStorage.removeItem('study_start_time');
    localStorage.removeItem('current_subject');
    
    // 跳转到登录页面
    window.location.href = 'login.html';
}

// 显示消息
function showMessage(message, type = 'success') {
    const alertElement = document.getElementById('message-alert');
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type} mb-4`;
    alertElement.classList.remove('d-none');
    
    // 3秒后隐藏
    setTimeout(() => {
        alertElement.classList.add('d-none');
    }, 3000);
}

// 获取学习数据
function getStudyData(username) {
    const data = localStorage.getItem(`${username}_study_data`);
    return data ? JSON.parse(data) : [];
}

// 获取签到数据
function getCheckinData(username) {
    const data = localStorage.getItem(`${username}_checkin_data`);
    return data ? JSON.parse(data) : [];
}

// 获取今天的日期字符串
function getTodayDate() {
    return getDateString(new Date());
}

// 获取日期字符串（YYYY-MM-DD）
function getDateString(date) {
    return date.toISOString().split('T')[0];
}

// 补零函数
function padZero(num) {
    return num < 10 ? '0' + num : num;
}

// 页面加载完成后初始化
window.onload = initApp;