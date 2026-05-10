const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

async function testAll() {
  console.log('=== FULL API TEST ===\n');
  let token = '';

  try {
    // 1. Health Check
    console.log('1. Health Check:');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('   ✓', health.data.message);

    // 2. Login
    console.log('\n2. Login (Admin):');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@perpustakaan.com',
      password: 'admin123'
    });
    token = login.data.data.token;
    console.log('   ✓ Login berhasil, role:', login.data.data.user.role);

    // 3. Register User Baru
    console.log('\n3. Register (Member baru):');
    const register = await axios.post(`${BASE_URL}/api/auth/register`, {
      username: 'membertest',
      email: 'test_' + Date.now() + '@perpustakaan.com',
      password: 'test123',
      fullName: 'Test User',
      role: 'member'
    });
    console.log('   ✓ User registered:', register.data.data.user.email);

    // 4. Get All Books
    console.log('\n4. Get All Books:');
    const books = await axios.get(`${BASE_URL}/api/books`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Total books:', books.data.data.books.length);

    // 5. Get Book by ID
    if (books.data.data.books.length > 0) {
      const bookId = books.data.data.books[0].id;
      console.log('\n5. Get Book by ID:');
      const bookDetail = await axios.get(`${BASE_URL}/api/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('   ✓ Book:', bookDetail.data.data.book.title);
    }

    // 6. Get Categories
    console.log('\n6. Get Categories:');
    const categories = await axios.get(`${BASE_URL}/api/books/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Categories:', categories.data.data.categories.join(', '));

    // 7. Create Transaction - Borrow
    console.log('\n7. Borrow Book:');
    if (books.data.data.books.length > 0) {
      const availableBook = books.data.data.books.find(b => b.available > 0);
      if (availableBook) {
        const borrow = await axios.post(`${BASE_URL}/api/transactions`, {
          bookId: availableBook.id,
          type: 'borrow',
          dueDate: '2026-06-15'
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('   ✓ Book borrowed! TransID:', borrow.data.data.transaction.id);
        var transId = borrow.data.data.transaction.id;
      } else {
        console.log('   ⚠ Semua buku sedang dipinjam');
      }
    }

    // 8. Return Book
    console.log('\n8. Return Book:');
    if (transId) {
      const returnBook = await axios.post(`${BASE_URL}/api/transactions`, {
        bookId: books.data.data.books[0].id,
        type: 'return',
        dueDate: '2026-06-15'
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('   ✓ Book returned!');
    }

    // 9. Get All Transactions
    console.log('\n9. Get All Transactions:');
    const transactions = await axios.get(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Total transactions:', transactions.data.data.transactions.length);

    // 10. Get My Transactions
    console.log('\n10. Get My Transactions:');
    const myTrans = await axios.get(`${BASE_URL}/api/transactions/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ My transactions:', myTrans.data.data.transactions.length);

    // 11. Gateway Status
    console.log('\n11. Gateway Status:');
    const status = await axios.get(`${BASE_URL}/gateway/status`);
    console.log('   ✓ Services:', JSON.stringify(status.data.services));

    console.log('\n=== SEMUA TEST PASSED ✅ ===');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testAll();