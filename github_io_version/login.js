// 登录页面逻辑

// 绑定登录表单提交事件
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('请输入用户名和密码');
        return;
    }
    
    // 验证用户
    if (verifyUser(username, password)) {
        // 登录成功
        localStorage.setItem('username', username);
        window.location.href = 'index.html';
    } else {
        showError('用户名或密码错误');
    }
});

// 验证用户
function verifyUser(username, password) {
    // 获取用户数据
    const users = getUsers();
    
    // 查找用户
    const user = users.find(user => user.username === username);
    if (!user) {
        return false;
    }
    
    // 验证密码
    return user.password_hash === hashPassword(password);
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
    const errorElement = document.getElementById('login-error');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
    
    // 3秒后隐藏
    setTimeout(() => {
        errorElement.classList.add('d-none');
    }, 3000);
}