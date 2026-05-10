const amqp = require('amqplib');

const QUEUE_NAME = 'library_events';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function startConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    console.log('📬 Waiting for messages in %s', QUEUE_NAME);
    
    channel.consume(QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        console.log('\n=== EVENT RECEIVED ===');
        console.log('Type:', content.eventType);
        console.log('Data:', JSON.stringify(content.data, null, 2));
        console.log('Time:', content.timestamp);
        console.log('========================\n');
        
        // Handle different event types
        handleEvent(content.eventType, content.data);
        
        channel.ack(msg);
      }
    });
    
    process.on('SIGINT', async () => {
      await channel.close();
      await connection.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Consumer error:', error.message);
    process.exit(1);
  }
}

function handleEvent(eventType, data) {
  switch (eventType) {
    case 'transaction.created':
      console.log('📗 处理: Peminjaman buku baru');
      console.log('  User:', data.userId);
      console.log('  Book:', data.bookId);
      break;
      
    case 'transaction.returned':
      console.log('📘 处理: Pengembalian buku');
      console.log('  User:', data.userId);
      console.log('  Book:', data.bookId);
      break;
      
    case 'transaction.status.updated':
      console.log('📙 处理: Status transaksi diperbarui');
      console.log('  Transaction:', data.transactionId);
      console.log('  New Status:', data.status);
      break;
      
    default:
      console.log('Unknown event type:', eventType);
  }
}

startConsumer();