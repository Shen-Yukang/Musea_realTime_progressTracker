# 多阶段构建 - 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制前端项目文件
COPY progress-tracker-v2/package*.json ./

# 安装依赖
RUN npm install

# 复制前端源代码
COPY progress-tracker-v2/ .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
