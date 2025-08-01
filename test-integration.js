// 前后端集成测试脚本
const API_BASE = 'http://localhost:3001/api';

async function testIntegration() {
  console.log('🧪 开始前后端集成测试...\n');

  try {
    // 1. 测试服务器健康检查
    console.log('1. 测试服务器健康检查...');
    const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 服务器健康检查通过:', healthData.status);

    // 2. 测试用户注册
    console.log('\n2. 测试用户注册...');
    const registerData = {
      username: 'testuser' + Date.now().toString().slice(-6), // 只使用字母数字
      email: 'test' + Date.now() + '@example.com',
      password: 'Password123' // 包含大小写字母和数字
    };

    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ 用户注册成功:', registerResult.message);
      
      // 3. 测试用户登录
      console.log('\n3. 测试用户登录...');
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      });

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        const token = loginResult.data.token;
        console.log('✅ 用户登录成功');

        // 4. 测试进展记录 API
        console.log('\n4. 测试进展记录 API...');
        const progressData = {
          date: new Date().toISOString().split('T')[0],
          mainTasks: '测试主要任务',
          challenges: '测试遇到的挑战',
          learnings: '测试学到的知识',
          nextDayPlan: '测试明日计划',
          rating: 8
        };

        const createProgressResponse = await fetch(`${API_BASE}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(progressData)
        });

        if (createProgressResponse.ok) {
          console.log('✅ 创建进展记录成功');

          // 获取进展记录
          const getProgressResponse = await fetch(`${API_BASE}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (getProgressResponse.ok) {
            const progressList = await getProgressResponse.json();
            console.log('✅ 获取进展记录成功，记录数:', progressList.data.progress.length);
          }
        }

        // 5. 测试反思记录 API
        console.log('\n5. 测试反思记录 API...');
        const reflectionData = {
          date: new Date().toISOString().split('T')[0],
          content: '测试反思内容',
          adjustments: '测试调整方向',
          type: 'daily'
        };

        const createReflectionResponse = await fetch(`${API_BASE}/reflections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reflectionData)
        });

        if (createReflectionResponse.ok) {
          console.log('✅ 创建反思记录成功');
        }

        // 6. 测试目标管理 API
        console.log('\n6. 测试目标管理 API...');
        const goalData = {
          name: '测试目标',
          description: '这是一个测试目标',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          category: 'learning'
        };

        const createGoalResponse = await fetch(`${API_BASE}/goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(goalData)
        });

        if (createGoalResponse.ok) {
          console.log('✅ 创建目标成功');
        }

        // 7. 测试分享功能 API
        console.log('\n7. 测试分享功能 API...');
        const shareData = {
          title: '测试分享',
          description: '这是一个测试分享',
          shareType: 'private',
          settings: {
            showProgress: true,
            showReflections: true,
            showGoals: true,
            dateRange: 'all'
          }
        };

        const createShareResponse = await fetch(`${API_BASE}/share/manage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(shareData)
        });

        if (createShareResponse.ok) {
          const shareResult = await createShareResponse.json();
          console.log('✅ 创建分享成功');
          console.log('🔗 分享链接:', shareResult.shareUrl);
        }

        console.log('\n🎉 所有测试通过！前后端集成成功！');
        
      } else {
        const loginError = await loginResponse.json();
        console.log('❌ 用户登录失败:', loginError.message);
      }
    } else {
      const registerError = await registerResponse.json();
      console.log('❌ 用户注册失败:', registerError.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testIntegration();
