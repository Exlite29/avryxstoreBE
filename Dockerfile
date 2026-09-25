# Use Node.js 18 Debian slim image (glibc => native modules use prebuilt binaries)
FROM node:18-bookworm-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies (downloads prebuilt binaries for sqlite3/sharp)
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs /data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/sari_sari_store.db
ENV DATABASE_URL="postgresql://bootstrap:bootstrap@localhost:5432/prisma?schema=public"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('node:http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start the application
CMD ["node", "src/app.js"]