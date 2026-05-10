# Tutorial Menggunakan RabbitMQ

## 1. Akses RabbitMQ Management UI

Buka browser dan akses:
```
http://localhost:15672
```

**Login:**
- Username: `guest`
- Password: `guest`

---

## 2. Struktur Queue

Di project ini:
- **Queue Name:** `library_events`
- **Durable:** Yes (data tidak hilang jika service restart)

---

## 3. Melihat Events

### Cara 1: via Management UI
1. Login ke RabbitMQ Management
2. Klik **Queues** tab
3. Klik queue `library_events`
4. Klik **Get Messages** untuk melihat isi queue

### Cara 2: via Command Line
```bash
# Lihat queue
docker exec -it perpustakaan-rabbitmq rabbitmqctl list_queues

# Lihat messages di queue
docker exec -it perpustakaan-rabbitmq rabbitmqctl get library_events
```

---

## 4. Cara Publish Event (Producer)

### Dari Transaction Service

```javascript
const messageQueueService = require('./services/messageQueue.service');

// Publish event saat pinjam buku
await messageQueueService.publishEvent('transaction.created', {
  userId: 'user-123',
  bookId: 'book-456',
  type: 'borrow',
  dueDate: '2026-06-15'
});

// Publish event saat kembalikan buku
await messageQueueService.publishEvent('transaction.returned', {
  userId: 'user-123',
  bookId: 'book-456'
});
```

---

## 5. Cara Membuat Consumer (Listener)

Buat file baru untuk mendengarkan events:

```javascript
// consumer.js
const amqp = require('amqplib');

const QUEUE_NAME = 'library_events';
const URL = 'amqp://guest:guest@localhost:5672';

async function consume() {
  const conn = await amqp.connect(URL);
  const ch = await conn.createChannel();
  
  await ch.assertQueue(QUEUE_NAME);
  
  console.log('Menunggu pesan...');
  
  ch.consume(QUEUE_NAME, (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      console.log('Received:', data);
      ch.ack(msg);
    }
  });
}

consume();
```

### Jalankan:
```bash
node consumer.js
```

---

## 6. Contoh Use Case Nyata

### 6.1 Kirim Email Notifikasi
```javascript
// Di consumer, setelah pinjam buku
if (eventType === 'transaction.created') {
  const userEmail = getUserEmail(data.userId);
  sendEmail(userEmail, 'Buku berhasil dipinjam!');
}
```

### 6.2 Update Dashboard Stats
```javascript
if (eventType === 'transaction.created') {
  incrementCounter('total_borrows');
}

if (eventType === 'transaction.returned') {
  incrementCounter('total_returns');
}
```

### 6.3 Log Aktivitas
```javascript
if (eventType) {
  saveToLog({
    event: eventType,
    data: data,
    timestamp: new Date()
  });
}
```

---

## 7. Testing RabbitMQ

### Test 1: Publish Manual via Node.js
```bash
node -e "
const amqp = require('amqplib');
const conn = await amqp.connect('amqp://guest:guest@localhost:5672');
const ch = await conn.createChannel();
ch.sendToQueue('library_events', Buffer.from(JSON.stringify({
  eventType: 'test.event',
  data: { message: 'Hello RabbitMQ!' },
  timestamp: new Date().toISOString()
})));
console.log('Message sent!');
process.exit(0);
"
```

### Test 2: Lihat di UI
1. Buka http://localhost:15672
2. Queues → library_events
3. Klik "Get Messages"
4. Should see test message

---

## 8. Diagram Cara Kerja

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Transaction   │ ───▶ │    RabbitMQ     │ ◀─── │    Consumer     │
│    Service     │      │  (Message Broker)│      │  (Listener)     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
       │                        │                        │
       │ publishEvent()        │ consume()              │
       │ ───────────────────▶  │ ◀───────────────────── │
       │                       │                        │
       │                       │ processEvent()        │
       │                       │ ──────────────────────▶│
       │                       │                        │
       │                library_events                 │
       │                   (queue)                    │
```

---

## 9. Contoh Full Implementation

### Producer (Sudah ada di transaction-service)
```javascript
// services/transaction-service/src/services/messageQueue.service.js
class MessageQueueService {
  async publishEvent(eventType, data) {
    const message = JSON.stringify({
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
    this.channel.sendToQueue('library_events', Buffer.from(message));
  }
}
```

### Consumer (Buat baru)
```javascript
// consumer/service.js
const amqp = require('amqplib');

async function start() {
  const conn = await amqp.connect('amqp://guest:guest@localhost:5672');
  const ch = await conn.createChannel();
  
  await ch.assertQueue('library_events', { durable: true });
  
  ch.consume('library_events', (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      console.log('📩 Event:', event.eventType, event.data);
      ch.ack(msg);
    }
  });
}

start();
```

---

## 10. Tips Debugging

| Masalah | Solusi |
|---------|--------|
| Tidak bisa connect | Cek RabbitMQ container running: `docker ps` |
| Queue tidak muncul | Cek nama queue sama persis |
| Message tidak keluar | Klik "Get Messages" di UI |
| Consumer tidak dapat pesan | Cek apakah queue sudah di-ack |

---

## 11. Commands Referensi

```bash
# Cek container status
docker ps | grep rabbitmq

# Lihat logs
docker logs perpustakaan-rabbitmq

# Buka shell RabbitMQ
docker exec -it perpustakaan-rabbitmq bash

# List queues
docker exec -it perpustakaan-rabbitmq rabbitmqctl list_queues

# Purge queue (hapus semua pesan)
docker exec -it perpustakaan-rabbitmq rabbitmqctl purge_queue library_events

# Cek messages
docker exec -it perpustakaan-rabbitmq rabbitmqctl get library_events
```

---

## 🎯 Mulai Sekarang!

### Step 1: Test Publish
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"bookId":"BOOK_ID","type":"borrow","dueDate":"2026-06-20"}'
```

### Step 2: Cek di RabbitMQ UI
1. Buka http://localhost:15672
2. Login: guest/guest
3. Klik **Queues** → **library_events**
4. Lihat "Messages" count naik

### Step 3: Buat Consumer
```bash
cd services/transaction-service
node src/services/eventConsumer.js
```

---

Mau saya tambahkan consumer untuk fungsional tertentu? (email, logging, dashboard)