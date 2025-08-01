-- 初始化数据库脚本
-- 这个脚本会在 PostgreSQL 容器首次启动时执行

-- 创建数据库（如果不存在）
-- CREATE DATABASE IF NOT EXISTS progress_tracker;

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展（如果需要）
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 这里可以添加其他初始化 SQL 语句
-- 例如：创建初始用户、设置权限等

-- 注意：实际的表结构会通过 Sequelize 迁移创建
