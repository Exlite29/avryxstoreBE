# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for sharp (image processing)
RUN apk add --no-cache vips-dev libpng-dev python3 make g++ libc6-compat

# Copy package files
COPY package*.json ./

# Install npm dependencies (ignore scripts to avoid native builds)
RUN npm ci --only=production --ignore-scripts

# Install sharp with prebuilt binaries
RUN npm install --only=production --prefer-offline --no-audit

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/app.js"]
