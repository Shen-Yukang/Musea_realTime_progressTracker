require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const SocketServer = require('./src/socket');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 创建 HTTP 服务器
    const server = http.createServer(app);

    // 初始化 Socket.io
    const socketServer = new SocketServer(server);

    // 将 socket 实例添加到 app 中，供其他地方使用
    app.set('socketio', socketServer);

    // 启动服务器
    server.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV}`);
      console.log(`🔌 WebSocket 服务已启用`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
