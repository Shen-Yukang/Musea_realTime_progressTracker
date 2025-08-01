const { sequelize, User, Progress, Reflection, Goal } = require('../src/models');

async function createTestData() {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 查找或创建测试用户
    let testUser = await User.findOne({ where: { email: 'test@example.com' } });

    if (!testUser) {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        profile: {
          name: '测试用户',
          bio: '这是一个测试用户账户'
        }
      });
      console.log('创建测试用户:', testUser.username);
    } else {
      console.log('使用现有测试用户:', testUser.username);
    }

    // 创建进展记录
    const progressData = [
      {
        userId: testUser.id,
        date: '2025-01-25',
        mainTasks: '完成了React组件开发，学习了Redux状态管理',
        challenges: '理解Redux的数据流有些困难',
        learnings: '掌握了组件间通信的最佳实践',
        nextDayPlan: '继续学习Redux中间件',
        rating: 8,
        mood: 'good'
      },
      {
        userId: testUser.id,
        date: '2025-01-26',
        mainTasks: '深入学习Redux中间件，完成了异步操作处理',
        challenges: '异步操作的错误处理比较复杂',
        learnings: '学会了使用Redux Thunk处理异步操作',
        nextDayPlan: '开始学习React Router',
        rating: 9,
        mood: 'excellent'
      },
      {
        userId: testUser.id,
        date: '2025-01-27',
        mainTasks: '学习React Router，实现了单页应用的路由功能',
        challenges: '嵌套路由的配置有些复杂',
        learnings: '理解了前端路由的工作原理',
        nextDayPlan: '整合所有学到的知识，开始项目实战',
        rating: 7,
        mood: 'good'
      }
    ];

    // 清除现有数据并创建新数据
    await Progress.destroy({ where: { userId: testUser.id } });
    for (const data of progressData) {
      await Progress.create(data);
    }
    console.log('创建了', progressData.length, '条进展记录');

    // 创建反思记录
    const reflectionData = [
      {
        userId: testUser.id,
        date: '2025-01-25',
        content: '今天的学习让我意识到前端开发的复杂性。React的组件化思想很有趣，但需要更多练习才能熟练掌握。',
        adjustments: '明天需要多做一些实际的编码练习',
        type: 'daily',
        priority: 'medium',
        status: 'completed'
      },
      {
        userId: testUser.id,
        date: '2025-01-27',
        content: '这周的学习进展不错，从React基础到Redux再到Router，知识体系逐渐完善。但还需要更多实战经验。',
        adjustments: '下周开始一个完整的项目实战，将所学知识综合运用',
        type: 'weekly',
        priority: 'high',
        status: 'completed'
      }
    ];

    await Reflection.destroy({ where: { userId: testUser.id } });
    for (const data of reflectionData) {
      await Reflection.create(data);
    }
    console.log('创建了', reflectionData.length, '条反思记录');

    // 创建目标
    const goalData = [
      {
        userId: testUser.id,
        name: '掌握React全家桶',
        description: '学习React、Redux、React Router等核心技术',
        startDate: '2025-01-20',
        endDate: '2025-02-20',
        priority: 'high',
        progress: 60,
        status: 'in_progress',
        category: '前端开发'
      },
      {
        userId: testUser.id,
        name: '完成个人项目',
        description: '使用React技术栈开发一个完整的个人项目',
        startDate: '2025-02-01',
        endDate: '2025-03-01',
        priority: 'high',
        progress: 10,
        status: 'in_progress',
        category: '项目实战'
      },
      {
        userId: testUser.id,
        name: '学习Node.js后端开发',
        description: '掌握Node.js、Express、数据库等后端技术',
        startDate: '2025-02-15',
        endDate: '2025-04-15',
        priority: 'medium',
        progress: 0,
        status: 'not_started',
        category: '后端开发'
      }
    ];

    await Goal.destroy({ where: { userId: testUser.id } });
    for (const data of goalData) {
      await Goal.create(data);
    }
    console.log('创建了', goalData.length, '个目标');

    console.log('\n✅ 测试数据创建完成！');
    console.log('测试用户信息:');
    console.log('邮箱: test@example.com');
    console.log('密码: password');
    console.log('\n可以使用这些信息在演示页面中登录测试分享功能。');

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestData();
}

module.exports = createTestData;
