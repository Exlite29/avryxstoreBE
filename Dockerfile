# Use Bun pinned to match the committed bun.lock (glibc => native modules use prebuilt binaries)
FROM oven/bun:1.4.2-debian

# Set working directory
WORKDIR /app

# Copy package files (Bun lockfile only; no npm package-lock.json)
COPY package.json bun.lock ./

# Install dependencies (downloads prebuilt binaries for sharp/native modules)
RUN bun install --production --no-audit --no-fund --frozen-lockfile

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
  CMD ["bun", "-e", "const r=await fetch('http://localhost:3000/health');process.exit(r.status===200?0:1).on('error',()=>process.exit(1))"]

# Start the application
CMD ["bun", "run", "src/app.js"]