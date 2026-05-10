# Tutorial Deployment Perpustakaan Backend Services

## 📋 Daftar Isi
1. [Struktur Project](#1-struktur-project)
2. [Deploy Lokal (Docker)](#2-deploy-lokal-docker)
3. [Deploy ke Server LeAds](#3-deploy-ke-server-leads)
4. [Setup Domain (Opsional)](#4-setup-domain-opsional)
5. [Verifikasi](#5-verifikasi)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Struktur Project

```
perpustakaan-backend-services/
├── package.json          # 1 package.json untuk semua service
├── Dockerfile            # 1 Dockerfile untuk semua service
├── docker-compose.yml   # Konfigurasi Docker
├── .env                 # Environment variables
├── gateway/src/         # API Gateway (port 3000)
├── services/
│   ├── auth-service/src/      # Auth Service (port 3001)
│   ├── book-service/src/     # Book Service (port 3002)
│   └── transaction-service/src/ # Transaction Service (port 3003)
├── scripts/             # Migration & Seed
├── DEPLOYMENT-TUTORIAL.md
└── RABBITMQ-TUTORIAL.md
```

---

## 2. Deploy Lokal (Docker)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build & Run
```bash
# Build image
docker-compose build --no-cache

# Jalankan container
docker-compose up -d

# Cek status
docker-compose ps
```

### Step 3: Verifikasi Lokal
```bash
# Health Check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@perpustakaan.com","password":"admin123"}'
```

### Step 4: Stop
```bash
docker-compose down
```

---

## 3. Deploy ke Server Leads

### A. Informasi Server
- **Host:** 103.147.92.134
- **Port SSH:** 8989
- **User:** mahasiswa
- **Password:** (lihat di Cpanel)

---

### B. Cara 1: via Git (Recommended)

#### Step 1: Push Project ke GitHub
```bash
# Di lokal
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/perpustakaan-backend.git
git push -u origin main
```

#### Step 2: Clone & Deploy di Server
```bash
# SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# Clone repository
git clone https://github.com/username/perpustakaan-backend.git
cd perpustakaan-backend

# Install dependencies
npm install

# Setup environment
cat > .env << 'EOF'
NODE_ENV=production
GATEWAY_PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_NAME=perpustakaan
DB_USER=root
DB_PASSWORD=root123
JWT_SECRET=your_new_secret_key_here
JWT_EXPIRES_IN=24h
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE=library_events
AUTH_SERVICE_PORT=3001
BOOK_SERVICE_PORT=3002
TRANSACTION_SERVICE_PORT=3003
EOF

# Build & Run
docker-compose build --no-cache
docker-compose up -d
```

---

### C. Cara 2: via Upload File

#### Step 1: Compress Project
```bash
# Di lokal
cd perpustakaan-backend-services
zip -r perpustakaan.zip . -x "node_modules/*" ".git/*"
```

#### Step 2: Upload ke Server
```bash
# Upload via SCP
scp -P 8989 perpustakaan.zip mahasiswa@103.147.92.134:~/
```

#### Step 3: Extract & Setup di Server
```bash
# SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# Extract
unzip perpustakaan.zip
cd perpustakaan-backend-services

# Install dependencies
npm install

# Setup .env
cat > .env << 'EOF'
NODE_ENV=production
GATEWAY_PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_NAME=perpustakaan
DB_USER=root
DB_PASSWORD=root123
JWT_SECRET=your_new_secret_key_here
JWT_EXPIRES_IN=24h
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE=library_events
AUTH_SERVICE_PORT=3001
BOOK_SERVICE_PORT=3002
TRANSACTION_SERVICE_PORT=3003
EOF

# Build & Run
docker-compose build --no-cache
docker-compose up -d
```

---

## 4. Setup Domain (Opsional)

### Jika pakai subdomain dari Leads:

#### Step 1: Buka Cpanel
- Login ke Cpanel Leads
- Pilih **Domains** → **Create A Record**

#### Step 2: Buat A Record
- **Hostname:** api (untuk api.domainanda.com)
- **IP Address:** 103.147.92.134
- **TTL:** 3600

#### Step 3: Setup Nginx Proxy
```bash
# SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# Install nginx
sudo apt install nginx

# Buat config
sudo nano /etc/nginx/sites-available/perpustakaan
```

```nginx
server {
    listen 80;
    server_name api.LEADS_DOMAIN_ANDA;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/perpustakaan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Verifikasi

### A. Cek Container
```bash
docker-compose ps
```

Harus ada:
- perpustakaan-mysql (running)
- perpustakaan-rabbitmq (running)
- perpustakaan-app (running)

### B. Test API
```bash
# Ganti IP dengan IP server atau domain

# Health Check
curl http://103.147.92.134:3000/api/health

# Login
curl -X POST http://103.147.92.134:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@perpustakaan.com","password":"admin123"}'

# Get Books (pakai token dari login)
curl http://103.147.92.134:3000/api/books \
  -H "Authorization: Bearer TOKEN_ANDA"
```

### C. Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@perpustakaan.com | admin123 |
| Librarian | librarian@perpustakaan.com | librarian123 |
| Member | member@perpustakaan.com | member123 |

---

## 6. Troubleshooting

### Problem: Port Already in Use
```bash
# Cek apa pakai port 3000
sudo lsof -i :3000

# Kill jika perlu
sudo kill -9 <PID>
```

### Problem: Database Connection Failed
```bash
# Tunggu MySQL siap (biasanya 10-30 detik)
sleep 30

# Cek logs
docker-compose logs mysql

# Restart
docker-compose restart
```

### Problem: Container tidak running
```bash
# Lihat logs
docker-compose logs app

# Restart semua
docker-compose restart
```

### Problem: Tidak bisa akses dari luar
```bash
# Cek firewall
sudo ufw status

# Buka port 3000
sudo ufw allow 3000/tcp
```

---

## 📝 Commands Ringkas

```bash
# Install
npm install

# Docker Lokal
docker-compose up -d
docker-compose down
docker-compose logs -f

# Docker Server
docker-compose up -d
docker-compose logs -f app
docker-compose restart
```

---

## ✅ Checklist Deployment

- [ ] SSH ke server berhasil
- [ ] Project ter-clone/upload ke server
- [ ] npm install berhasil
- [ ] .env sudah dikonfigurasi
- [ ] docker-compose build berhasil
- [ ] docker-compose up -d berhasil
- [ ] Health check OK
- [ ] Login berfungsi
- [ ] Semua endpoint bisa diakses

---

## 🚀 Mulai Sekarang!

```bash
# 1. SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# 2. Clone project
git clone https://github.com/username/perpustakaan-backend.git
cd perpustakaan-backend

# 3. Setup & jalankan
npm install
docker-compose up -d

# 4. Test
curl http://localhost:3000/api/health
```

**Selamat! API Perpustakaan sudah online! 🎉**