# Perpustakaan Backend Services

Sistem manajemen perpustakaan berbasis microservice dengan Node.js, Express, MySQL, dan RabbitMQ.

## Arsitektur

```
┌─────────────┐
│   Client   │
└──────┬──────┘
       ▼
┌─────────────────┐
│  API Gateway   │  Port 3000
│  - Rate Limit   │
│  - Routing      │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Services                                   │
│  ├── Auth Service      (Port 3001)          │
│  ├── Book Service      (Port 3002)          │
│  └── Transaction Service (Port 3003)        │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  MySQL DB      │     │   RabbitMQ    │
│  (Port 3306)   │     │  (Port 5672)  │
└─────────────────┘     └──────────────┘
```

## Struktur Project

```
perpustakaan-backend-services/
├── package.json          # 1 package.json untuk semua service
├── Dockerfile            # 1 Dockerfile
├── docker-compose.yml   # Konfigurasi Docker
├── .env                 # Environment variables
├── gateway/src/         # API Gateway
├── services/
│   ├── auth-service/src/
│   ├── book-service/src/
│   └── transaction-service/src/
├── scripts/              # Migration & Seed
└── DEPLOYMENT-FINAL.md  # Tutorial Deployment
```

## Prasyarat

- Docker & Docker Compose
- Node.js 18+ (untuk development lokal)

##安装 (Installation)

```bash
npm install
```

## Cara Menjalankan

### 1. Lokal dengan Docker

```bash
# Build dan jalankan
docker-compose up -d

# Cek status
docker-compose ps

# Lihat logs
docker-compose logs -f
```

### 2. Lokal tanpa Docker

```bash
# Terminal 1 - Gateway
node gateway/src/index.js

# Terminal 2 - Auth Service
node services/auth-service/src/index.js

# Terminal 3 - Book Service
node services/book-service/src/index.js

# Terminal 4 - Transaction Service
node services/transaction-service/src/index.js
```

### 3. Setup Database

```bash
# Migration
node scripts/migrate.js

# Seed data
node scripts/seed.js
```

## API Endpoints

### Authentication
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrasi user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile |

### Books
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/books` | List buku |
| GET | `/api/books/:id` | Detail buku |
| POST | `/api/books` | Tambah buku |
| PUT | `/api/books/:id` | Update buku |
| DELETE | `/api/books/:id` | Hapus buku |
| GET | `/api/books/categories` | List kategori |

### Transactions
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/transactions` | List transaksi |
| GET | `/api/transactions/my` | Transaksi saya |
| POST | `/api/transactions` | Pinjam/Kembali buku |

## Testing

```bash
# Semua endpoint
node test-all.js
```

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@perpustakaan.com | admin123 |
| Librarian | librarian@perpustakaan.com | librarian123 |
| Member | member@perpustakaan.com | member123 |

## Deployment

Lihat `DEPLOYMENT-FINAL.md` untuk panduan lengkap deployment ke server LeAds.

## RabbitMQ

Lihat `RABBITMQ-TUTORIAL.md` untuk panduan menggunakan RabbitMQ.

## License

MIT