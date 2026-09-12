# ---------- 构建阶段：编译纯前端静态资源 ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- web：nginx 托管静态文件 ----------
FROM nginx:1.27-alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

# ---------- verify：一次性验收（Vitest 27 组合 + Playwright 端到端） ----------
# 基础镜像自带 Chromium 等浏览器与运行依赖，@playwright/test 版本须与其一致。
FROM mcr.microsoft.com/playwright:v1.47.2-jammy AS verify
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV BASE_URL=http://web
CMD ["npm", "run", "verify"]
