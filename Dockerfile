# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# Runtime stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist .

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Nginx runs as non-root by default in alpine
CMD ["nginx", "-g", "daemon off;"]
