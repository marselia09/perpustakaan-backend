const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const config = require('./config');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests' }
});

app.use('/api', limiter);

// AUTH SERVICE - maps /api/auth/xxx to /xxx
app.post('/api/auth/register', proxyAuth);
app.post('/api/auth/login', proxyAuth);
app.get('/api/auth/profile', proxyAuth);
app.put('/api/auth/profile', proxyAuth);
app.get('/api/auth/users', proxyAuth);

async function proxyAuth(req, res) {
  const path = req.path.replace('/api/auth', '');
  await proxy(req, res, config.services.auth + path);
}

// BOOKS SERVICE - maps /api/books/xxx to /xxx
app.get('/api/books', proxyBook);
app.get('/api/books/categories', proxyBook);
app.get('/api/books/:id', proxyBook);
app.post('/api/books', proxyBook);
app.put('/api/books/:id', proxyBook);
app.delete('/api/books/:id', proxyBook);

async function proxyBook(req, res) {
  const path = req.path.replace('/api/books', '');
  await proxy(req, res, config.services.book + path);
}

// TRANSACTIONS SERVICE
app.get('/api/transactions', proxyTrans);
app.get('/api/transactions/my', proxyTrans);
app.get('/api/transactions/:id', proxyTrans);
app.post('/api/transactions', proxyTrans);
app.put('/api/transactions/:id/status', proxyTrans);

async function proxyTrans(req, res) {
  const path = req.path.replace('/api/transactions', '');
  await proxy(req, res, config.services.transaction + path);
}

async function proxy(req, res, url) {
  try {
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined,
        'content-length': undefined
      },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      res.status(504).json({ success: false, message: 'Gateway timeout' });
    } else {
      res.status(502).json({ success: false, message: 'Service unavailable' });
    }
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Gateway running', timestamp: new Date().toISOString() });
});

app.get('/gateway/status', async (req, res) => {
  const check = async (url) => {
    try {
      await axios.get(`${url}/health`, { timeout: 3000 });
      return 'up';
    } catch { return 'down'; }
  };
  res.json({
    gateway: 'running',
    services: {
      auth: await check(config.services.auth),
      book: await check(config.services.book),
      transaction: await check(config.services.transaction)
    }
  });
});

app.listen(config.port, () => {
  console.log(`API Gateway running on port ${config.port}`);
});

module.exports = app;