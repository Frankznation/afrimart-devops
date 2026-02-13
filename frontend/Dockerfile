# Build stage - pinned base image
FROM node:18.20.4-alpine3.19 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage - pinned nginx
FROM nginx:1.25.4-alpine

# Security: run as non-root (nginx alpine default is nginx user)
# Add health check file before switching (already runs as nginx by default)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN echo "OK" > /usr/share/nginx/html/health.html && chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/health.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
