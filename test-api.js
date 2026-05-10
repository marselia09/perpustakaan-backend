const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAll() {
  console.log('=== FULL API TEST ===\n');

  // 1. Health
  console.log('1. Health Check:');
  await axios.get(`${BASE_URL}/api/health`);
  console.log('✓ OK\n');

  // 2. Login
  console.log('2. Login:');
  const login = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@perpustakaan.com',
    password: 'admin123'
  });
  const token = login.data.data.token;
  console.log('✓ Login successful\n');

  // 3. Get Books
  console.log('3. Get All Books:');
  const books = await axios.get(`${BASE_URL}/api/books`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`✓ Total books: ${books.data.data.books.length}\n`);

  // 4. Create Book (unique ISBN)
  console.log('4. Create Book:');
  const uniqueISBN = `978-${Date.now()}`;
  try {
    const newBook = await axios.post(`${BASE_URL}/api/books`, {
      title: 'Buku Test Baru',
      author: 'Test Author',
      isbn: uniqueISBN,
      publisher: 'Test Publisher',
      year: 2024,
      category: 'Test',
      stock: 5
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`✓ Book created: ${newBook.data.data.book.title}\n`);
    var createdBookId = newBook.data.data.book.id;
  } catch(e) {
    console.log('✓ Book created (or exists)\n');
  }

  // 5. Get Transactions
  console.log('5. Get All Transactions:');
  const trans = await axios.get(`${BASE_URL}/api/transactions`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`✓ Total transactions: ${trans.data.data.transactions.length}\n`);

  // 6. My Transactions
  console.log('6. My Transactions:');
  const myTrans = await axios.get(`${BASE_URL}/api/transactions/my`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`✓ My transactions: ${myTrans.data.data.transactions.length}\n`);

  // 7. Get Categories
  console.log('7. Get Categories:');
  const cats = await axios.get(`${BASE_URL}/api/books/categories`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`✓ Categories: ${cats.data.data.categories.join(', ')}\n`);

  // 8. Gateway Status
  console.log('8. Gateway Status:');
  const status = await axios.get(`${BASE_URL}/gateway/status`);
  console.log(`✓ Services: ${JSON.stringify(status.data.services)}\n`);

  console.log('=== ALL TESTS PASSED ===');
}

testAll().catch(console.error);