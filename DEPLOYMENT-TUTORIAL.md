# Tutorial Deployment Perpustakaan Backend Services

## 📋 Daftar Isi
1. [Deploy Lokal dengan Docker](#1-deploy-lokal-dengan-docker)
2. [Deploy ke Server Leads](#2-deploy-ke-server-leads)
3. [Verifikasi Setelah Deployment](#3-verifikasi-setelah-deployment)
4. [Troubleshooting](#4-troubleshooting)

---

## 1. Deploy Lokal dengan Docker

### Prasyarat
- Docker Desktop terinstall (https://docker.com)
- Port 3000, 3306, 5672 tersedia

### Step-by-Step

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd perpustakaan-backend-services
```

#### Step 2: Setup Environment
```bash
# Copy file .env (sudah ada)
# Edit jika perlu, contoh:

cat > .env << 'EOF'
NODE_ENV=production

# Gateway
GATEWAY_PORT=3000

# MySQL
DB_HOST=mysql
DB_PORT=3306
DB_NAME=perpustakaan
DB_USER=root
DB_PASSWORD=root123
DB_ROOT_PASSWORD=root123

# JWT
JWT_SECRET=xDOvFo9t0MNUaMXlIzt7Dkg3sND6ZoITGkdn66tbvsu
JWT_EXPIRES_IN=24h

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE=library_events

# Service Ports
AUTH_SERVICE_PORT=3001
BOOK_SERVICE_PORT=3002
TRANSACTION_SERVICE_PORT=3003

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
BOOK_SERVICE_URL=http://book-service:3002
TRANSACTION_SERVICE_URL=http://transaction-service:3003

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
LOG_LEVEL=info
EOF
```

#### Step 3: Build dan Jalankan Docker
```bash
# Build semua image
docker-compose build --no-cache

# Jalankan semua container
docker-compose up -d

# Cek status
docker-compose ps
```

#### Step 4: Cek Logs
```bash
# Lihat semua logs
docker-compose logs -f

# Lihat logs service tertentu
docker-compose logs -f gateway
docker-compose logs -f auth-service
docker-compose logs -f book-service
docker-compose logs -f transaction-service
```

#### Step 5: Verifikasi dengan curl
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@perpustakaan.com","password":"admin123"}'
```

---

## 2. Deploy ke Server Leads

### Informasi Server
- **Host:** 103.147.92.134
- **Port SSH:** 8989
- **User:** mahasiswa
- **Password:** (lihat di Cpanel Leads)

### Step-by-Step

#### Step 1: Koneksi ke Server via SSH

**Dari Mac/Linux:**
```bash
ssh -p 8989 mahasiswa@103.147.92.134
```

**Dari Windows (PuTTY):**
- Host: 103.147.92.134
- Port: 8989
- Username: mahasiswa
- Password: (isi dari Cpanel)

**Dari Windows (PowerShell/CMD):**
```powershell
ssh -p 8989 mahasiswa@103.147.92.134
```

#### Step 2: Install Docker di Server (jika belum ada)
```bash
# Cek apakah Docker sudah terinstall
docker --version
docker-compose --version

# Jika belum, install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### Step 3: Upload Project ke Server

**Cara A: Clone dari Git (Jika sudah di-push)**
```bash
git clone <repository-url>
cd perpustakaan-backend-services
```

**Cara B: Upload via SCP (Dari lokal)**
```bash
# Dari terminal lokal (bukan dari server)
scp -P 8989 -r /path/to/perpustakaan-backend-services.zip mahasiswa@103.147.92.134:~/

# Login ke server, extract
ssh -p 8989 mahasiswa@103.147.92.134
unzip perpustakaan-backend-services.zip
cd perpustakaan-backend-services
```

**Cara C: Copy via Paste (Jika menggunakan terminal yang support copy-paste)**
```bash
# Push dulu ke GitHub, lalu clone di server
# ATAU copy file satu per satu
```

#### Step 4: Setup Environment di Server
```bash
cd perpustakaan-backend-services

# Buat file .env untuk production server
cat > .env << 'EOF'
NODE_ENV=production

# Gateway
GATEWAY_PORT=3000

# MySQL
DB_HOST=mysql
DB_PORT=3306
DB_NAME=perpustakaan
DB_USER=root
DB_PASSWORD=root123
DB_ROOT_PASSWORD=root123

# JWT - GANTI DENGAN SECRET BARU
JWT_SECRET=your-new-secret-key-here-generate-random
JWT_EXPIRES_IN=24h

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE=library_events

# Service Ports
AUTH_SERVICE_PORT=3001
BOOK_SERVICE_PORT=3002
TRANSACTION_SERVICE_PORT=3003

# Service URLs (internal Docker network)
AUTH_SERVICE_URL=http://auth-service:3001
BOOK_SERVICE_URL=http://book-service:3002
TRANSACTION_SERVICE_URL=http://transaction-service:3003

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
LOG_LEVEL=info
EOF
```

#### Step 5: Build dan Run Docker di Server
```bash
# Build image
docker-compose build --no-cache

# Jalankan container
docker-compose up -d

# Cek status
docker-compose ps
```

#### Step 6: Setup Domain/Subdomain (Opsional)

Jika ingin akses via domain:
1. Buka CPanel → Domains → Addon Domain / Subdomain
2. Buat subdomain: `api.perpustakaan.xyz`
3. Setup Proxy di Nginx:

```bash
# Buat config Nginx
sudo nano /etc/nginx/sites-available/perpustakaan
```

```nginx
server {
    listen 80;
    server_name api.perpustakaan.xyz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable dan restart Nginx
sudo ln -s /etc/nginx/sites-available/perpustakaan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Verifikasi Setelah Deployment

### A. Cek Status Container
```bash
docker-compose ps
```

Harus ada:
- perpustakaan-gateway
- perpustakaan-auth
- perpustakaan-book
- perpustakaan-transaction
- perpustakaan-mysql
- perpustakaan-rabbitmq

### B. Cek Logs
```bash
# Semua service
docker-compose logs -f

# Service tertentu
docker-compose logs -f gateway
```

### C. Test API
```bash
# Ganti 103.147.92.134 dengan IP server atau domain

# 1. Health Check
curl http://103.147.92.134:3000/api/health

# 2. Login
curl -X POST http://103.147.92.134:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@perpustakaan.com","password":"admin123"}'

# 3. Get Books (gunakan token dari login)
TOKEN="eyJhbGci..."
curl -X GET http://103.147.92.134:3000/api/books \
  -H "Authorization: Bearer $TOKEN"
```

### D. Cek Database
```bash
# Login ke MySQL container
docker exec -it perpustakaan-mysql mysql -uroot -pperpustakaan

# Atau langsung
docker exec -it perpustakaan-mysql mysql -uroot -proot123 -e "USE perpustakaan; SELECT * FROM users;"
```

---

## 4. Troubleshooting

### Problem: Container tidak start

**Cek logs:**
```bash
docker-compose logs -f <service-name>
```

**Common solutions:**
```bash
# Restart semua container
docker-compose restart

# Rebuild tanpa cache
docker-compose build --no-cache
docker-compose up -d
```

### Problem: Database connection error

```bash
# Cek MySQL running
docker ps | grep mysql
docker logs perpustakaan-mysql

# Tunggu sampai database ready (biasanya 10-30 detik)
sleep 30
docker-compose restart
```

### Problem: Port sudah digunakan

```bash
# Cek apa yang menggunakan port 3000
sudo lsof -i :3000

# Kill process jika perlu
sudo kill -9 <PID>
```

### Problem: images tidak ter-pull

```bash
# Login ke Docker registry jika perlu
docker login

# Pull images manually
docker pull mysql:8.0
docker pull rabbitmq:3-management-alpine
```

### Problem: Tidak bisa akses dari luar

```bash
# Cek firewall
sudo ufw status
sudo ufw allow 3000/tcp

# Atau buka port
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## 📝 Quick Reference

### Commands yang sering digunakan

| Command | Fungsi |
|---------|--------|
| `docker-compose up -d` | Jalankan semua container |
| `docker-compose down` | Stop semua container |
| `docker-compose restart` | Restart semua container |
| `docker-compose logs -f` | Lihat logs real-time |
| `docker-compose ps` | Lihat status container |
| `docker-compose build --no-cache` | Rebuild semua image |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@perpustakaan.com | admin123 |
| Librarian | librarian@perpustakaan.com | librarian123 |
| Member | member@perpustakaan.com | member123 |

### API Base URL

- **Local:** http://localhost:3000
- **Server:** http://103.147.92.134:3000
- **Dengan Domain:** http://api.perpustakaan.xyz

---

## ✅ Checklist Deployment

- [ ] SSH ke server berhasil
- [ ] Docker terinstall dan running
- [ ] Project ter-copy ke server
- [ ] File .env sudah dikonfigurasi
- [ ] docker-compose build berhasil
- [ ] docker-compose up -d berhasil
- [ ] Semua container running (docker-compose ps)
- [ ] Health check OK (curl ke /api/health)
- [ ] Login berfungsi
- [ ] Semua endpoint bisa diakses

---

## 🚀 Mulai Sekarang!

```bash
# 1. SSH ke server
ssh -p 8989 mahasiswa@103.147.92.134

# 2. Clone/Copy project
git clone <repo-url>
cd perpustakaan-backend-services

# 3. Setup dan jalankan
docker-compose up -d

# 4. Test
curl http://localhost:3000/api/health
```

**Selamat! API Perpustakaan sudah online! 🎉**