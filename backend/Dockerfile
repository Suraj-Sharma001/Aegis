FROM node:18-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Run database migrations
RUN npx prisma generate
RUN npx prisma migrate deploy

EXPOSE 8080

USER node

CMD ["node", "src/server.js"]