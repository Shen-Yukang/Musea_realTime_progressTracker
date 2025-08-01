#!/bin/bash

echo "🔧 修复端口占用问题..."

# 停止 Docker 容器
echo "🛑 停止 Docker 容器..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# 强制停止所有容器
echo "🧹 清理所有容器..."
docker stop $(docker ps -q) 2>/dev/null || true

# 检查端口占用
echo "🔍 检查端口占用..."

check_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "⚠️  端口 $port 被进程 $pid 占用"
        echo "🔪 杀掉进程 $pid..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
        
        # 再次检查
        local new_pid=$(lsof -ti:$port 2>/dev/null)
        if [ -z "$new_pid" ]; then
            echo "✅ 端口 $port 已释放"
        else
            echo "❌ 端口 $port 仍被占用，可能需要手动处理"
        fi
    else
        echo "✅ 端口 $port 可用"
    fi
}

# 检查常用端口
check_port 3000
check_port 3001
check_port 5432

echo ""
echo "🎉 端口清理完成！"
echo ""
echo "现在可以启动应用了："
echo "🔹 终端1: cd backend && npm run dev"
echo "🔹 终端2: cd progress-tracker-v2 && npm run dev"
