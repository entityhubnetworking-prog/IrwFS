# GitHub Actions Setup Guide

## Required Secrets

Untuk menjalankan workflows, Anda perlu menambahkan secrets di GitHub:

### Cara Menambahkan Secrets:

1. Buka repository: https://github.com/entityhubnetworking-prog/IrwFS
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Tambahkan secrets berikut:

---

### Backend Deploy Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_HOST` | `3.84.94.77` | AWS server IP |
| `AWS_USER` | `ubuntu` | SSH username |
| `AWS_SSH_KEY` | *(SSH private key)* | SSH private key untuk akses server |

---

### Untuk Build Android (Optional)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ANDROID_KEYSTORE` | *(base64)* | Keystore file (optional) |
| `ANDROID_KEYSTORE_PASSWORD` | *(password)* | Keystore password (optional) |
| `ANDROID_KEY_ALIAS` | *(alias)* | Key alias (optional) |
| `ANDROID_KEY_PASSWORD` | *(password)* | Key password (optional) |

---

## Manual Trigger Workflows

Anda bisa menjalankan workflow secara manual:

1. Buka **Actions** tab di GitHub
2. Pilih workflow yang ingin dijalankan
3. Klik **Run workflow**

---

## Create Release

Untuk membuat release dengan semua build artifacts:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Ini akan otomatis:
- Build Windows app (.exe)
- Build Linux app (.AppImage)
- Build macOS app (.dmg)
- Build Android APK
- Create GitHub Release dengan semua artifacts

---

## Workflow Status

| Workflow | Trigger | Status |
|----------|---------|--------|
| Build Desktop App | Push to main | ✅ Active |
| Build Android APK | Push to main | ✅ Active |
| Deploy Backend | Push to main | ✅ Active |
| Release | Tag push (v*) | ✅ Active |

---

## Troubleshooting

### Jika workflow gagal:

1. Cek **Actions** tab untuk error logs
2. Pastikan semua secrets sudah dikonfigurasi
3. Untuk Android build, pastikan struktur folder benar

### Untuk backend deploy:

Pastikan SSH key sudah ditambahkan dengan format yang benar:
```
-----BEGIN RSA PRIVATE KEY-----
...key content...
-----END RSA PRIVATE KEY-----
```
