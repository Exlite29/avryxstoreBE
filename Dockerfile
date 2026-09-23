# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for sharp (image processing)
RUN apk add --no-cache vips-dev libpng-dev python3 make g++ libc6-compat

# Copy package files
COPY package*.json ./

# Install npm dependencies (runs postinstall to compile native modules like sqlite3)
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="postgresql://bootstrap:bootstrap@localhost:5432/prisma?schema=public"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/app.js"]
