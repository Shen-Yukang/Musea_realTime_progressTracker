FROM node:20-alpine

# 安装必要的工具
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 暴露端口
EXPOSE 3001

# 启动命令
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
