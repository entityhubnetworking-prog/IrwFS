# IrwFS - Face Swap Ecosystem

<div align="center">

![IrwFS Logo](https://img.shields.io/badge/IrwFS-Face%20Swap%20Ecosystem-blue?style=for-the-badge)

**Complete Face Swap Solution with Backend API, Desktop App, and Mobile App**

[![Backend Deploy](https://github.com/entityhubnetworking-prog/IrwFS/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/entityhubnetworking-prog/IrwFS/actions/workflows/backend-deploy.yml)
[![Desktop Build](https://github.com/entityhubnetworking-prog/IrwFS/actions/workflows/desktop-build.yml/badge.svg)](https://github.com/entityhubnetworking-prog/IrwFS/actions/workflows/desktop-build.yml)
[![Android Build](https://github.com/entityhubnetworking-prog/IrwFS/actions/workflows/android-build.yml/badge.svg)](https://github.com/entityhubnetworking-prog/IrwFS/actions/workflows/android-build.yml)

</div>

---

## 📁 Project Structure

```
IrwFS/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config, database, security
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── main.py      # Application entry
│   ├── requirements.txt
│   └── .env.example
│
├── desktop-app/          # Electron.js Desktop App
│   ├── main.js          # Electron main process
│   ├── preload.js       # IPC bridge
│   ├── src/
│   │   ├── index.html   # UI
│   │   ├── styles.css   # Styling
│   │   └── app.js       # Frontend logic
│   └── package.json
│
├── mobile-app/           # React Native Android App
│   ├── src/
│   │   ├── screens/     # UI screens
│   │   ├── services/    # API service
│   │   ├── context/     # Auth context
│   │   └── types/       # TypeScript types
│   ├── App.tsx          # Entry point
│   └── package.json
│
└── .github/workflows/    # GitHub Actions
    ├── backend-deploy.yml
    ├── desktop-build.yml
    ├── android-build.yml
    └── release.yml
```

---

## 🚀 Quick Start

### Backend Setup

1. **Clone repository:**
```bash
git clone https://github.com/entityhubnetworking-prog/IrwFS.git
cd IrwFS/backend
```

2. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run server:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Desktop App

1. **Install dependencies:**
```bash
cd desktop-app
npm install
```

2. **Run development:**
```bash
npm start
```

3. **Build for production:**
```bash
npm run build:win    # Windows
npm run build:linux  # Linux
npm run build:mac    # macOS
```

### Mobile App

1. **Install dependencies:**
```bash
cd mobile-app
npm install
```

2. **Run on Android:**
```bash
npm run android
```

3. **Build APK:**
```bash
cd android
./gradlew assembleRelease
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login (OAuth2) |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/auth/verify/{token}` | Verify email |
| `POST` | `/api/auth/forgot-password` | Request password reset |

### Face Swap
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/faceswap/image` | Swap face in image |
| `POST` | `/api/faceswap/video` | Swap face in video |
| `GET` | `/api/faceswap/history` | Get swap history |
| `DELETE` | `/api/faceswap/{id}` | Delete swap |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `PUT` | `/api/admin/users/{id}` | Update user |
| `DELETE` | `/api/admin/users/{id}` | Delete user |
| `GET` | `/api/admin/stats` | System statistics |

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in backend directory:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/irwfs

# JWT
SECRET_KEY=your-secret-key-min-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Tencent Cloud Storage (optional)
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_BUCKET=your-bucket
TENCENT_REGION=ap-jakarta

# Email SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Admin
SUPERADMIN_EMAIL=admin@irwfs.com
SUPERADMIN_PASSWORD=secure-password
```

---

## 🔄 GitHub Actions Workflows

### Automatic Builds

| Workflow | Trigger | Output |
|----------|---------|--------|
| `desktop-build.yml` | Push to main | Windows/Linux/macOS builds |
| `android-build.yml` | Push to main | Android APK |
| `backend-deploy.yml` | Push to main | Deploy to server |
| `release.yml` | Tag push (v*) | GitHub Release |

### Create Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will automatically:
1. Build Windows, Linux, macOS apps
2. Build Android APK
3. Create GitHub Release with all artifacts

---

## 📱 Features

### Desktop App
- ✅ User authentication
- ✅ Image face swap
- ✅ Video face swap
- ✅ History management
- ✅ Download results
- ✅ Dark theme UI

### Mobile App
- ✅ User authentication
- ✅ Camera integration
- ✅ Gallery picker
- ✅ Image & Video face swap
- ✅ History management
- ✅ Settings & account info

### Backend
- ✅ JWT authentication
- ✅ Email verification
- ✅ Password reset
- ✅ User quota system
- ✅ Admin panel
- ✅ Tencent Cloud Storage

---

## 📊 User Quota System

| Plan | Video Quota | Image Quota |
|------|-------------|-------------|
| Free | 3 | 10 |
| Premium | Unlimited | Unlimited |

---

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt
- Email verification required
- Role-based access control
- Input validation with Pydantic

---

## 📝 License

MIT License

---

## 👥 Support

For issues or questions, please open a GitHub issue.
