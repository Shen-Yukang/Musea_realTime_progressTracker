#!/bin/bash

echo "🚀 Progress Tracker 快速启动"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查是否在项目根目录
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "progress-tracker-v2" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo ""
echo "🔧 安装依赖..."

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install --silent
cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd progress-tracker-v2
npm install --silent
cd ..

echo ""
echo "✅ 依赖安装完成！"
echo ""
echo "🚀 现在请在两个不同的终端中运行："
echo ""
echo "🔹 终端1 (后端):"
echo "   cd backend && npm run dev"
echo ""
echo "🔹 终端2 (前端):"
echo "   cd progress-tracker-v2 && npm run dev"
echo ""
echo "🌐 然后访问: http://localhost:3000"
echo ""
echo "💡 提示: 后端会在 http://localhost:3001 运行"
