#!/bin/bash

echo "🚀 启动简化版 Progress Tracker..."

if [ "$1" = "docker" ]; then
    echo "🐳 使用 Docker 启动..."
    docker-compose -f docker-compose.simple.yml up --build
elif [ "$1" = "local" ]; then
    echo "💻 使用本地模式启动..."
    echo "请在两个不同的终端中运行："
    echo ""
    echo "终端1 - 后端："
    echo "cd backend && npm install && npm run dev"
    echo ""
    echo "终端2 - 前端："
    echo "cd progress-tracker-v2 && npm install && npm run dev"
    echo ""
    echo "然后访问: http://localhost:3000"
else
    echo "📖 使用方法:"
    echo "  ./start-simple.sh local   - 本地开发模式（推荐）"
    echo "  ./start-simple.sh docker  - Docker 模式"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:3001"
fi
