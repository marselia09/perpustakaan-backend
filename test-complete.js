const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testComplete() {
  console.log('=== COMPLETE API TEST ===\n');

  // Login
  const login = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@perpustakaan.com',
    password: 'admin123'
  });
  const token = login.data.data.token;
  console.log('✓ Logged in\n');

  // Get transactions
  const trans = await axios.get(`${BASE_URL}/api/transactions`, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  const transactions = trans.data.data.transactions;
  console.log(`Total transactions: ${transactions.length}`);
  
  if (transactions.length > 0) {
    const pendingTrans = transactions.find(t => t.status === 'borrowed');
    if (pendingTrans) {
      console.log(`\nFound borrowed book: ${pendingTrans.bookId}`);
      console.log(`Transaction ID: ${pendingTrans.id}`);
      
      // Test return book
      console.log('\nTesting return...');
      const returned = await axios.put(
        `${BASE_URL}/api/transactions/${pendingTrans.id}/return`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✓ Book returned!', returned.data.message);
    }
  } else {
    // Borrow a book first
    console.log('\nBorrowing a book first...');
    const books = await axios.get(`${BASE_URL}/api/books`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    const book = books.data.data.books[0];
    console.log(`Borrowing: ${book.title}`);
    
    const borrowed = await axios.post(
      `${BASE_URL}/api/transactions`,
      { bookId: book.id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Book borrowed!', borrowed.data.message);
    
    // Now return it
    console.log('\nReturning book...');
    const transId = borrowed.data.data.transaction.id;
    const returned = await axios.put(
      `${BASE_URL}/api/transactions/${transId}/return`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Book returned!', returned.data.message);
  }

  console.log('\n=== ALL TESTS PASSED ===');
}

testComplete().catch(e => console.error('Error:', e.message));