# Personal Ledger - Docker Deployment Guide

This guide will help you deploy the Personal Ledger application using Docker Compose on any machine.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone or copy the application folder to your target machine**

2. **Set up environment variables**
   ```bash
   cp .env.docker .env
   ```
   
   Edit `.env` and change the `ENCRYPTION_KEY` to a secure random string:
   ```bash
   ENCRYPTION_KEY=your-very-secure-random-key-here
   ```

3. **Build and start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Open your browser and navigate to: `http://localhost:3000`
   - The app will be ready once both containers are healthy

## Docker Compose Services

### App Service
- **Container**: `personal-ledger-app`
- **Port**: 3000
- **Health Check**: HTTP check on `/api/health`
- **Restart Policy**: unless-stopped

### MongoDB Service
- **Container**: `personal-ledger-mongodb`
- **Port**: 27017
- **Data Persistence**: Docker volumes
- **Health Check**: MongoDB ping command
- **Restart Policy**: unless-stopped

## Useful Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# MongoDB only
docker-compose logs -f mongodb
```

### Restart services
```bash
docker-compose restart
```

### Rebuild and restart (after code changes)
```bash
docker-compose up -d --build
```

### Check service status
```bash
docker-compose ps
```

## Data Persistence

Data is stored in Docker volumes:
- `mongodb-data`: MongoDB database files
- `mongodb-config`: MongoDB configuration files

### Backup Data

To backup your data:
```bash
# Create backup directory
mkdir -p backups

# Backup MongoDB data
docker-compose exec mongodb mongodump --out=/data/backup
docker cp personal-ledger-mongodb:/data/backup ./backups/mongodb-backup-$(date +%Y%m%d)
```

### Restore Data

To restore from backup:
```bash
docker cp ./backups/mongodb-backup-YYYYMMDD personal-ledger-mongodb:/data/restore
docker-compose exec mongodb mongorestore /data/restore
```

## Troubleshooting

### Application won't start
1. Check logs: `docker-compose logs app`
2. Verify MongoDB is healthy: `docker-compose ps`
3. Ensure port 3000 is not in use: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)

### MongoDB connection issues
1. Check MongoDB logs: `docker-compose logs mongodb`
2. Verify MongoDB is running: `docker-compose ps mongodb`
3. Test connection: `docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"`

### Reset everything (WARNING: Deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Production Deployment

For production deployment:

1. **Change the encryption key** in `.env` to a strong random value
2. **Use a reverse proxy** (nginx, Caddy) for HTTPS
3. **Set up regular backups** of MongoDB data
4. **Monitor logs** and set up alerts
5. **Limit MongoDB port exposure** (remove port mapping if not needed externally)

### Example nginx configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Updating the Application

1. Pull/copy the latest code
2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Security Notes

- The `ENCRYPTION_KEY` is used to encrypt sensitive data (security answers)
- Change it before first use and keep it secure
- If you lose the encryption key, you won't be able to decrypt existing security answers
- MongoDB is not password-protected by default in this setup. For production, consider adding authentication.

## Support

For issues or questions, check the application logs first:
```bash
docker-compose logs -f
```
