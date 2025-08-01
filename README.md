# 📊 Progress Tracker - 每日进展追踪与反思助手

一个现代化的全栈进展追踪应用，帮助你记录每日进展、监控目标完成情况，并在需要时提醒你进行反思和方向调整。

## 🚀 快速开始

### 方式一：Docker 一键启动（推荐）

#### 前置要求
- Docker 和 Docker Compose

#### 启动命令
```bash
# Linux/macOS
./start.sh dev    # 启动开发环境
./start.sh prod   # 启动生产环境
./start.sh stop   # 停止所有服务
./start.sh clean  # 清理所有容器和数据

# Windows
start.bat dev     # 启动开发环境
start.bat prod    # 启动生产环境
start.bat stop    # 停止所有服务
start.bat clean   # 清理所有容器和数据
```

#### 访问地址
- **开发环境**: http://localhost:3000
- **生产环境**: http://localhost:8080
- **后端 API**: http://localhost:3001
- **数据库**: localhost:5432

### 方式二：本地开发

#### 前置要求
- Node.js 18+
- PostgreSQL 数据库

#### 后端启动
```bash
cd backend
npm install
npm run dev
```

#### 前端启动
```bash
cd progress-tracker-v2
npm install
npm run dev
```

## 📋 项目简述

[index.html](./index.html)这个应用将帮助你每天记录进展，监控目标完成情况，并在需要时提醒你进行反思和方向调整。
这个网页应用提供了以下功能：

1. **每日进展记录**：
   - 记录每天完成的任务、遇到的问题、学到的经验
   - 为每天的进展评分（1-10分）
   - 制定明日计划

2. **进展概览**：
   - 可视化展示最近7天的进展趋势
   - 显示目标完成情况与时间进度的对比
   - 提醒需要注意的问题（如进展评分连续下降、目标进度落后等）

3. **反思提醒**：
   - 根据进展情况智能提醒是否需要反思
   - 提供反思记录功能，包括反思内容和需要调整的方向
   - 历史反思记录查看

4. **目标管理**：
   - 添加、编辑和删除目标
   - 设置目标优先级和截止日期
   - 跟踪目标完成进度

这个应用会帮助你：
- 每天记录进展，形成习惯
- 通过图表直观了解进展趋势
- 在进展不佳或方向可能偏离时收到提醒
- 定期反思，避免瞎忙，确保在正确的方向上前进
- 管理和跟踪目标完成情况

所有数据都保存在浏览器的本地存储中，确保隐私安全。你可以根据需要进一步定制功能或样式。

### 当前存储实现方式

1. **localStorage**：
   - 浏览器提供的本地存储机制
   - 存储容量约 5MB
   - 数据以键值对形式存储
   - 数据持久化（关闭浏览器后仍保留）
   - 同步操作（可能阻塞主线程）

2. **具体实现**：
   ```javascript
   // 保存数据
   localStorage.setItem('progressData', JSON.stringify(progressData));
   
   // 读取数据
   const progressData = JSON.parse(localStorage.getItem('progressData')) || [];
   ```

3. **存储的数据结构**：
   - `progressData`：每日进展记录
   - `reflectionData`：反思记录
   - `goalsData`：目标管理数据

### 下一步计划：本地数据库 + React + Docker

这是一个非常好的升级计划！以下是详细实施方案：

#### 1. 技术栈选择

| 组件 | 技术选择 | 理由 |
|------|----------|------|
| 前端框架 | React | 组件化开发，生态成熟 |
| 状态管理 | Redux Toolkit | 可预测的状态管理 |
| 本地数据库 | IndexedDB | 浏览器内置数据库，存储容量大 |
| 数据库封装 | Dexie.js | 简化 IndexedDB 操作 |
| 构建工具 | Vite | 快速构建和热更新 |
| 容器化 | Docker | 便于部署和环境一致性 |

#### 2. 项目结构设计

```
progress-tracker/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/          # 通用组件
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Toast.jsx
│   │   ├── progress/        # 进展追踪模块
│   │   │   ├── ProgressForm.jsx
│   │   │   ├── ProgressList.jsx
│   │   │   └── ProgressChart.jsx
│   │   ├── reflection/      # 反思模块
│   │   │   ├── ReflectionForm.jsx
│   │   │   ├── ReflectionAlert.jsx
│   │   │   └── ReflectionHistory.jsx
│   │   └── goals/           # 目标管理模块
│   │       ├── GoalForm.jsx
│   │       ├── GoalList.jsx
│   │       └── GoalItem.jsx
│   ├── hooks/               # 自定义Hooks
│   │   ├── useProgressData.js
│   │   ├── useReflectionData.js
│   │   └── useGoalsData.js
│   ├── store/               # Redux状态管理
│   │   ├── index.js
│   │   ├── progressSlice.js
│   │   ├── reflectionSlice.js
│   │   └── goalsSlice.js
│   ├── db/                  # 数据库操作
│   │   ├── index.js         # Dexie数据库初始化
│   │   ├── progressService.js
│   │   ├── reflectionService.js
│   │   └── goalsService.js
│   ├── utils/               # 工具函数
│   │   ├── dateUtils.js
│   │   └── validationUtils.js
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── .dockerignore
├── Dockerfile
├── package.json
├── vite.config.js
└── README.md
```

#### 3. 核心实现步骤

**步骤1：初始化React项目**
```bash
npm create vite@latest progress-tracker -- --template react
cd progress-tracker
npm install
npm install redux @reduxjs/toolkit react-redux dexie
```

**步骤2：数据库封装 (db/index.js)**
```javascript
import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

// 定义数据库结构
db.version(1).stores({
  progress: 'date, mainTasks, challenges, learnings, nextDayPlan, rating',
  reflections: 'date, content, adjustments, createdAt',
  goals: '++id, name, description, startDate, endDate, priority, progress, completed'
});

// 数据库服务
export const progressService = {
  async getAll() {
    return await db.progress.toArray();
  },
  
  async add(progress) {
    return await db.progress.add(progress);
  },
  
  async update(date, progress) {
    return await db.progress.put({ ...progress, date });
  },
  
  async delete(date) {
    return await db.progress.delete(date);
  }
};

// 类似地创建 reflectionService 和 goalsService
```

**步骤3：Redux状态管理 (store/index.js)**
```javascript
import { configureStore } from '@reduxjs/toolkit';
import progressReducer from './progressSlice';
import reflectionReducer from './reflectionSlice';
import goalsReducer from './goalsSlice';

export const store = configureStore({
  reducer: {
    progress: progressReducer,
    reflection: reflectionReducer,
    goals: goalsReducer
  }
});
```

**步骤4：创建自定义Hook (hooks/useProgressData.js)**
```javascript
import { useState, useEffect } from 'react';
import { progressService } from '../db';
import { useDispatch } from 'react-redux';
import { setProgressData } from '../store/progressSlice';

export const useProgressData = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await progressService.getAll();
        dispatch(setProgressData(data));
      } catch (error) {
        console.error('Failed to fetch progress data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);
  
  return { loading };
};
```

**步骤5：组件示例 (components/progress/ProgressForm.jsx)**
```javascript
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addProgress } from '../../store/progressSlice';
import { progressService } from '../../db';
import Button from '../common/Button';
import Card from '../common/Card';

const ProgressForm = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mainTasks: '',
    challenges: '',
    learnings: '',
    nextDayPlan: '',
    rating: 5
  });
  
  const dispatch = useDispatch();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 保存到数据库
      await progressService.add(formData);
      // 更新Redux状态
      dispatch(addProgress(formData));
      // 重置表单
      setFormData({
        ...formData,
        mainTasks: '',
        challenges: '',
        learnings: '',
        nextDayPlan: '',
        rating: 5
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };
  
  return (
    <Card title="今日进展记录">
      <form onSubmit={handleSubmit}>
        {/* 表单字段 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">日期</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        {/* 其他表单字段类似 */}
        
        <Button type="submit">保存进展</Button>
      </form>
    </Card>
  );
};

export default ProgressForm;
```

**步骤6：Docker配置 (Dockerfile)**
```dockerfile
# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**步骤7：Nginx配置 (nginx.conf)**
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. 部署流程

1. **构建Docker镜像**：
   ```bash
   docker build -t progress-tracker .
   ```

2. **运行容器**：
   ```bash
   docker run -d -p 8080:80 --name progress-tracker-app progress-tracker
   ```

3. **访问应用**：
   打开浏览器访问 `http://localhost:8080`

#### 5. 优势分析

| 方面 | 原实现 | 新方案 | 优势 |
|------|--------|--------|------|
| 存储能力 | localStorage (5MB) | IndexedDB (50MB+) | 更大存储容量 |
| 数据查询 | 简单键值对 | 支持索引和复杂查询 | 更高效的数据检索 |
| 代码组织 | 单文件 | 模块化组件 | 更好的可维护性 |
| 状态管理 | 原生状态 | Redux | 可预测的状态管理 |
| 部署方式 | 静态文件 | Docker容器 | 环境一致性，易于扩展 |
| 开发体验 | 原生JS | React + 热更新 | 更高效的开发流程 |

#### 6. 后续优化方向

1. **数据同步**：添加与云端同步的功能
2. **PWA支持**：添加离线功能和安装到桌面
3. **数据分析**：添加更智能的进展分析和建议
4. **通知系统**：添加浏览器通知提醒
5. **主题定制**：添加深色模式和个性化主题

这个升级方案将显著提升应用的性能、可维护性和用户体验，同时为未来的功能扩展打下坚实基础。