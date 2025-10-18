# Use official Node.js LTS (Long Term Support) image
FROM node:20-alpine

# Install system dependencies for better performance and security
# RUN apk add --no-cache \
#    tini \
#    curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
# RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Copy the .env file into the container
COPY .env /app/.env

# Create uploads directory if needed
# RUN mkdir -p uploads && chmod 755 uploads

# Use non-root user for security
# RUN addgroup -g 1001 -S nodejs && \
#   adduser -S nodejs -u 1001 && \
#    chown -R nodejs:nodejs /app
RUN npm install
# USER nodejs

# Expose the port your app runs on
EXPOSE 8080

# Use tini to handle signals properly
# ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "server.js"]
