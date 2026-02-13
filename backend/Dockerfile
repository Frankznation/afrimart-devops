# Build stage - pinned base image
FROM node:18.20.4-alpine3.19 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Production stage
FROM node:18.20.4-alpine3.19

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs and uploads directories with correct ownership
RUN mkdir -p logs uploads && chown -R nodejs:nodejs logs uploads

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/server.js"]
