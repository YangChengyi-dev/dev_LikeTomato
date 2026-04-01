// 注册页面逻辑

// 绑定注册表单提交事件
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('请输入用户名和密码');
        return;
    }
    
    // 检查用户是否存在
    if (userExists(username)) {
        showError('用户名已存在');
        return;
    }
    
    // 添加新用户
    addUser(username, password);
    
    // 登录并跳转到主页
    localStorage.setItem('username', username);
    window.location.href = 'index.html';
});

// 检查用户是否存在
function userExists(username) {
    const users = getUsers();
    return users.some(user => user.username === username);
}

// 添加新用户
function addUser(username, password) {
    const users = getUsers();
    users.push({
        username: username,
        password_hash: hashPassword(password)
    });
    localStorage.setItem('users', JSON.stringify(users));
    
    // 初始化用户数据文件
    localStorage.setItem(`${username}_study_data`, JSON.stringify([]));
    localStorage.setItem(`${username}_checkin_data`, JSON.stringify([]));
}

// 获取用户数据
function getUsers() {
    const usersData = localStorage.getItem('users');
    return usersData ? JSON.parse(usersData) : [];
}

// 密码哈希函数
function hashPassword(password) {
    // 简单的哈希实现，实际项目中应使用更安全的方法
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// 显示错误消息
function showError(message) {
    const errorElement = document.getElementById('signup-error');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
    
    // 3秒后隐藏
    setTimeout(() => {
        errorElement.classList.add('d-none');
    }, 3000);
}