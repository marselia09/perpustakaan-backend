FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production

EXPOSE 3000 3001 3002 3003

CMD ["sh", "-c", " \
    echo 'Starting all services...' && \
    node gateway/src/index.js & \
    node services/auth-service/src/index.js & \
    node services/book-service/src/index.js & \
    node services/transaction-service/src/index.js & \
    wait"]