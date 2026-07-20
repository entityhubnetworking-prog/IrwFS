# IrwFS Backend

FastAPI backend for the IrwFS Face Swap Ecosystem.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Run the server:
```bash
python -m app.main
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (OAuth2)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify/{token}` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Face Swap
- `POST /api/faceswap/image` - Swap face in image
- `POST /api/faceswap/video` - Swap face in video
- `GET /api/faceswap/history` - Get swap history
- `GET /api/faceswap/{id}` - Get specific swap
- `DELETE /api/faceswap/{id}` - Delete swap

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get user details
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/users/{id}/password` - View user password (superadmin)
- `GET /api/admin/stats` - Get system statistics

## Default Superadmin
- Email: `admin@irwfs.com`
- Password: `change_this_password`

**Important:** Change the superadmin password in production!
