# Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Expecting build context to be the project root
COPY frontend/package*.json ./
RUN npm install

COPY frontend ./

# Build arguments for environment variables
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV NODE_ENV=production

RUN npm run build

# Serve with Nginx
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# copy dist folder from builder to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
