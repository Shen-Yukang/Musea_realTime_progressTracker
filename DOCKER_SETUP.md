# 🐳 Docker 部署指南

## 前置要求

### 1. 安装 Docker Desktop
- **macOS**: 从 [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) 下载安装
- **Windows**: 从 [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) 下载安装
- **Linux**: 安装 Docker Engine 和 Docker Compose

### 2. 启动 Docker Desktop
确保 Docker Desktop 正在运行（系统托盘中有 Docker 图标）

### 3. 验证安装
```bash
docker --version
docker-compose --version
```

## 🚀 一键启动

### 开发环境
```bash
# Linux/macOS
./start.sh dev

# Windows
start.bat dev
```

### 生产环境
```bash
# Linux/macOS
./start.sh prod

# Windows
start.bat prod
```

## 📋 服务说明

### 开发环境 (docker-compose.dev.yml)
- **PostgreSQL**: 端口 5432
- **后端 API**: 端口 3001
- **前端开发服务器**: 端口 3000
- **热重载**: 支持代码修改自动重启

### 生产环境 (docker-compose.yml)
- **PostgreSQL**: 端口 5432
- **后端 API**: 端口 3001
- **前端 Nginx**: 端口 8080
- **优化构建**: 生产级别的优化和压缩

## 🔧 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
./start.sh stop

# 清理所有数据
./start.sh clean

# 重新构建
docker-compose up --build

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 🐛 故障排除

### 1. Docker 未启动
```
Error: Cannot connect to the Docker daemon
```
**解决方案**: 启动 Docker Desktop

### 2. 端口被占用
```
Error: Port 3000 is already in use
```
**解决方案**: 
- 停止占用端口的进程
- 或修改 docker-compose.yml 中的端口映射

### 3. 数据库连接失败
```
Error: Connection refused
```
**解决方案**: 
- 等待数据库完全启动（约 30 秒）
- 检查数据库健康检查状态

### 4. 前端无法访问后端
**解决方案**: 
- 确保后端服务已启动
- 检查 CORS 配置
- 验证 API 地址配置

## 📁 目录结构

```
progress-tracker/
├── docker-compose.yml          # 生产环境配置
├── docker-compose.dev.yml      # 开发环境配置
├── Dockerfile                  # 前端生产构建
├── Dockerfile.dev              # 前端开发构建
├── start.sh                    # Linux/macOS 启动脚本
├── start.bat                   # Windows 启动脚本
├── backend/
│   ├── Dockerfile              # 后端构建
│   ├── docker-entrypoint.sh    # 后端启动脚本
│   └── init.sql                # 数据库初始化
└── progress-tracker-v2/        # 前端源码
```

## 🔒 环境变量

### 开发环境
- `NODE_ENV=development`
- `DB_HOST=postgres`
- `JWT_SECRET=dev-jwt-secret-key`

### 生产环境
- `NODE_ENV=production`
- `DB_HOST=postgres`
- `JWT_SECRET=your-super-secret-jwt-key-change-in-production`

**⚠️ 注意**: 生产环境请务必修改 JWT_SECRET！
