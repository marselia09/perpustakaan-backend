const amqp = require('amqplib');
const config = require('../config');

class MessageQueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queue = config.rabbitmq.queue;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      console.log('Transaction Service - Connected to RabbitMQ');
      return true;
    } catch (error) {
      console.error('RabbitMQ connection failed:', error.message);
      return false;
    }
  }

  async publishEvent(eventType, data) {
    try {
      if (!this.channel) return false;
      const message = JSON.stringify({ eventType, data, timestamp: new Date().toISOString() });
      this.channel.sendToQueue(this.queue, Buffer.from(message), { persistent: true });
      console.log(`Event published: ${eventType}`);
      return true;
    } catch (error) {
      console.error('Failed to publish event:', error.message);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('Error closing RabbitMQ:', error.message);
    }
  }
}

module.exports = new MessageQueueService();