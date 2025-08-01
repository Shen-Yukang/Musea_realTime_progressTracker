#!/bin/sh

echo "🚀 启动后端服务..."

# 等待数据库启动
echo "⏳ 等待数据库连接..."
while ! nc -z $DB_HOST $DB_PORT; do
  echo "等待数据库 $DB_HOST:$DB_PORT..."
  sleep 2
done
echo "✅ 数据库连接成功"

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
npm run db:migrate

# 启动应用
echo "🎯 启动应用..."
exec "$@"
