#!/bin/bash

# IrwFS Deployment Script
# Run this script on the AWS server to deploy/update the backend

set -e

echo "🚀 Deploying IrwFS Backend..."

# Update system
sudo apt-get update

# Install dependencies if not present
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    sudo apt-get install -y python3 python3-pip python3-venv
fi

# Create project directory
mkdir -p ~/irwfs-backend
cd ~/irwfs-backend

# Setup virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy asyncpg psycopg2-binary python-jose passlib python-multipart email-validator pydantic pydantic-settings aiofiles python-dotenv bcrypt numpy opencv-python-headless Pillow onnxruntime-gpu

# Create .env if not exists
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://irwfs_user:irwfs_secure_pass_2024@localhost:5432/irwfs
DATABASE_URL_SYNC=postgresql://irwfs_user:irwfs_secure_pass_2024@localhost:5432/irwfs
SECRET_KEY=irwfs-super-secret-jwt-key-change-in-production-32chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
TENCENT_SECRET_ID=
TENCENT_SECRET_KEY=
TENCENT_BUCKET=
TENCENT_REGION=ap-jakarta
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@irwfs.com
APP_NAME=IrwFS
APP_VERSION=1.0.0
DEBUG=True
ALLOWED_ORIGINS=*
USE_GPU=True
ONNX_PROVIDER=CUDAExecutionProvider
FREE_USER_VIDEO_QUOTA=3
FREE_USER_IMAGE_QUOTA=10
SUPERADMIN_EMAIL=admin@irwfs.com
SUPERADMIN_PASSWORD=admin123
EOF
fi

# Create systemd service
sudo tee /etc/systemd/system/irwfs.service > /dev/null << 'EOF'
[Unit]
Description=IrwFS Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/irwfs-backend
Environment="PATH=/home/ubuntu/irwfs-backend/venv/bin"
ExecStart=/home/ubuntu/irwfs-backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable irwfs
sudo systemctl restart irwfs

# Configure Nginx
sudo tee /etc/nginx/sites-available/irwfs > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/irwfs /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "✅ IrwFS Backend deployed successfully!"
echo ""
echo "API URL: http://$(curl -s ifconfig.me):8000"
echo "API Docs: http://$(curl -s ifconfig.me):8000/docs"
echo ""
echo "Default Superadmin:"
echo "  Email: admin@irwfs.com"
echo "  Password: admin123"
echo ""
echo "⚠️  Please change the superadmin password in production!"
