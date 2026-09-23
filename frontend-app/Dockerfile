# Stage 1: Build the static web bundle using Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors & install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and export static Expo web build
COPY . .
RUN npx expo export --platform web

# Stage 2: Serve static app using Nginx
FROM nginx:alpine AS runner

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
