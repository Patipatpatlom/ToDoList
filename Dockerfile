# ==========================================
# Stage 1: Build & Compile TypeScript
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine binary support
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code and configurations
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript and bundle artifacts
RUN npm run build

# Prune devDependencies to keep only production packages
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for runtime Prisma connection
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Create and use non-root application user
RUN addgroup -S nodejs -g 1001 && adduser -S nodejs -u 1001 -G nodejs

# Copy pruned production dependencies, Prisma Client, and compiled artifacts
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
