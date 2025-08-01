#!/bin/bash

echo "🔍 检查 Docker 状态..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo "请从 https://docs.docker.com/desktop/install/mac-install/ 下载安装 Docker Desktop"
    exit 1
fi

echo "✅ Docker 已安装: $(docker --version)"

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker 未运行"
    echo ""
    echo "请启动 Docker Desktop:"
    echo "1. 打开 Launchpad 或 Applications 文件夹"
    echo "2. 点击 Docker Desktop 应用"
    echo "3. 等待状态栏显示绿色 Docker 图标"
    echo ""
    echo "或者运行: open -a Docker"
    exit 1
fi

echo "✅ Docker 正在运行"

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

echo "✅ Docker Compose 已安装: $(docker-compose --version)"

echo ""
echo "🎉 Docker 环境检查通过！"
echo "现在可以运行: ./start.sh dev"
