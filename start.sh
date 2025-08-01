#!/bin/bash

# Progress Tracker 一键启动脚本

echo "🚀 启动 Progress Tracker 应用..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker Desktop"
    echo "下载地址: https://docs.docker.com/desktop/install/mac-install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    echo ""
    echo "启动方法:"
    echo "1. 打开 Launchpad 或 Applications 文件夹"
    echo "2. 点击 Docker Desktop 应用"
    echo "3. 等待状态栏显示绿色 Docker 图标"
    echo ""
    echo "或者运行: open -a Docker"
    echo ""
    echo "启动后请重新运行此脚本"
    exit 1
fi

echo "✅ Docker 环境检查通过"

# 检查参数
if [ "$1" = "dev" ]; then
    echo "🔧 启动开发环境..."
    docker-compose -f docker-compose.dev.yml up --build
elif [ "$1" = "prod" ]; then
    echo "🏭 启动生产环境..."
    docker-compose up --build
elif [ "$1" = "stop" ]; then
    echo "🛑 停止所有服务..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
elif [ "$1" = "clean" ]; then
    echo "🧹 清理所有容器和数据..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
else
    echo "📖 使用方法:"
    echo "  ./start.sh dev    - 启动开发环境"
    echo "  ./start.sh prod   - 启动生产环境"
    echo "  ./start.sh stop   - 停止所有服务"
    echo "  ./start.sh clean  - 清理所有容器和数据"
    echo ""
    echo "🌐 访问地址:"
    echo "  开发环境: http://localhost:3000"
    echo "  生产环境: http://localhost:8080"
    echo "  后端 API: http://localhost:3001"
    echo "  数据库:   localhost:5432"
fi
