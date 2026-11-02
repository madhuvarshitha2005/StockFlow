# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server code and Prisma
COPY server/ ./
RUN npx prisma generate

# Copy built frontend assets from Stage 1
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose port
EXPOSE 5000

# Push DB schema, run seed, and start server
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
