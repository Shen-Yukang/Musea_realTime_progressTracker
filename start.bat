@echo off
REM Progress Tracker 一键启动脚本 (Windows)

echo 🚀 启动 Progress Tracker 应用...

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

REM 检查参数
if "%1"=="dev" (
    echo 🔧 启动开发环境...
    docker-compose -f docker-compose.dev.yml up --build
) else if "%1"=="prod" (
    echo 🏭 启动生产环境...
    docker-compose up --build
) else if "%1"=="stop" (
    echo 🛑 停止所有服务...
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
) else if "%1"=="clean" (
    echo 🧹 清理所有容器和数据...
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
) else (
    echo 📖 使用方法:
    echo   start.bat dev    - 启动开发环境
    echo   start.bat prod   - 启动生产环境
    echo   start.bat stop   - 停止所有服务
    echo   start.bat clean  - 清理所有容器和数据
    echo.
    echo 🌐 访问地址:
    echo   开发环境: http://localhost:3000
    echo   生产环境: http://localhost:8080
    echo   后端 API: http://localhost:3001
    echo   数据库:   localhost:5432
    pause
)
