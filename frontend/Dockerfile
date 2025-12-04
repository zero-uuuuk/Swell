# Build Stage
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run은 8080 포트를 사용합니다
EXPOSE 8080

# Nginx 실행 (daemon off로 포그라운드 실행)
CMD ["nginx", "-g", "daemon off;"]
