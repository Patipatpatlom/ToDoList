# ==========================================
# Stage 1: Build & Compile React Static SPA
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Clean install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build production static bundle into dist/
RUN npm run build

# ==========================================
# Stage 2: High Performance Nginx Web Server
# ==========================================
FROM nginx:alpine AS runner

# Remove default Nginx welcome site
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck to verify Nginx serves HTTP 200
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
