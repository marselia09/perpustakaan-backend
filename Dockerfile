FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
COPY gateway/package*.json ./gateway/
COPY services/auth-service/package*.json ./services/auth-service/
COPY services/book-service/package*.json ./services/book-service/
COPY services/transaction-service/package*.json ./services/transaction-service/

RUN npm install

COPY . .

RUN mkdir -p /app/gateway/src /app/services/auth-service/src /app/services/book-service/src /app/services/transaction-service/src

ENV NODE_ENV=production

EXPOSE 3000 3001 3002 3003

CMD ["sh", "-c", " \
    echo 'Starting all services...' && \
    node gateway/src/index.js & \
    node services/auth-service/src/index.js & \
    node services/book-service/src/index.js & \
    node services/transaction-service/src/index.js & \
    wait"]