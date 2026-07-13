# Easy Learn — Hostinger VPS Deployment Guide

**Domain:** `quizify.cloud`  
**Stack:** React 19 (Vite) + Express.js + MongoDB Atlas (MERN)  
**Node version:** `22.18.0` (matches local dev machine)  
**Strategy:** Nginx serves the built React SPA; PM2 keeps the Express API alive; MongoDB Atlas as the database.

---

## Before You Start — Remote Allowlists

Do these two things **before touching the server**, or the app will fail to connect.

### MongoDB Atlas — Whitelist the VPS IP
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to **Network Access → Add IP Address**
3. Add `quizify.cloud` → Save

### Firebase — Authorize the Domain
1. Open [Firebase Console](https://console.firebase.google.com) → project **learningo-c9ac4**
2. Go to **Authentication → Settings → Authorized Domains**
3. Add `quizify.cloud` → Save

---

## 1. Connect to the Server

```bash
ssh root@quizify.cloud
```

---

## 2. System Updates & Essential Tools

```bash
apt update && apt upgrade -y
apt install -y git curl build-essential ufw nginx
```

---

## 3. Install Node.js 22.18.0

This matches your local dev machine exactly.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v   # must print v22.x.x
npm -v    # should print 10.x.x
```

---

## 4. Install PM2

```bash
npm install -g pm2
```

---

## 5. Clone the Repository

```bash
cd /var/www
git clone https://github.com/SutirthaChakraborty/easy_learning.git
cd easy_learning
```

> Replace the URL with your actual GitHub repo URL.

---

## 6. Set Up Server Environment Variables

```bash
cd /var/www/easy_learning/server
nano .env
```

Copy the block below and fill in your values. Your local `server/.env` already has all of these — copy every value across (not just `MONGODB_URI`/`JWT_SECRET`), and only update `CLIENT_URL`. The app uses **three separate MongoDB connections** (main, admin, super-admin) and **four separate JWT secrets** (student, admin, super-admin, teacher) — if any of these are missing, that login flow's Google sign-in throws and the API returns a generic "Internal server error".

```env
PORT=5000

# Main app DB (students)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.wqthdik.mongodb.net/mydb?retryWrites=true&w=majority
JWT_SECRET=<replace-with-a-long-random-string>
JWT_EXPIRES_IN=7d

# Admin DB (org admins + tutors/teachers) — separate cluster
ADMIN_MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.r9mcewc.mongodb.net/admindb?retryWrites=true&w=majority
ADMIN_JWT_SECRET=<replace-with-a-long-random-string>
ADMIN_JWT_EXPIRES_IN=7d

# Super-admin DB — separate cluster
SUPERADMIN_MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xszbqqt.mongodb.net/superadmindb?retryWrites=true&w=majority
SUPERADMIN_JWT_SECRET=<replace-with-a-long-random-string>

# Teacher auth (uses the admin DB's Tutor model, but its own JWT secret)
TEACHER_JWT_SECRET=<replace-with-a-long-random-string>
TEACHER_JWT_EXPIRES_IN=7d

CLIENT_URL=https://quizify.cloud
```

> **`CLIENT_URL`** must be exactly `https://quizify.cloud` — this is what Express uses for CORS.  
> **`MONGODB_URI` / `ADMIN_MONGODB_URI` / `SUPERADMIN_MONGODB_URI`** — copy the full URIs from your local `server/.env`; each points to a different Atlas cluster (`wqthdik`, `r9mcewc`, `xszbqqt` respectively).  
> **Every `*_JWT_SECRET`** — generate a strong secret per key: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. It's fine to reuse your local `.env` values instead of regenerating.  
> **MongoDB Atlas Network Access** — remember all three clusters need the VPS IP whitelisted (see "Before You Start"), not just the one `mydb` cluster.

---

## 7. Set Up Client Environment Variables

```bash
cd /var/www/easy_learning/client
nano .env
```

```env
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_API_BASE_URL=https://quizify.cloud/api
```

> **`VITE_FIREBASE_API_KEY`** — copy from your local `client/.env`.  
> **`VITE_API_BASE_URL`** — tells React where to send API requests; Nginx will proxy `/api` → Express on port 5000.  
> All other Firebase values (`authDomain`, `projectId`, etc.) are already hardcoded in `client/src/firebase/auth.js` — no changes needed there.

---

## 8. Install Dependencies & Build the Client

```bash
# Server dependencies
cd /var/www/easy_learning/server
npm install

# Client dependencies + production build
cd /var/www/easy_learning/client
npm install
npm run build
```

The production-ready static files are now in `/var/www/easy_learning/client/dist/`.

---

## 9. Seed the Database (First Deploy Only)

```bash
cd /var/www/easy_learning/server
npm run seed
```

Skip this on subsequent deploys.

---

## 10. Start the API with PM2

```bash
cd /var/www/easy_learning/server
pm2 start server.js --name easy-learn-api
pm2 save

# Make PM2 auto-start on server reboot
pm2 startup
# Run the command that PM2 prints out
```

Check it is running:

```bash
pm2 status
pm2 logs easy-learn-api --lines 30
```

---

## 11. Configure Nginx

```bash
nano /etc/nginx/sites-available/easy-learn
```

Paste:

```nginx
server {
    listen 80;
    server_name quizify.cloud;

    # Serve the React build
    root /var/www/easy_learning/client/dist;
    index index.html;

    # React Router — all unknown paths fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy /api/* to Express on port 5000
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/easy-learn /etc/nginx/sites-enabled/
nginx -t                  # must say "syntax is ok"
systemctl reload nginx
```

---

## 12. Open the Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'    # opens ports 80 and 443
ufw enable
ufw status
```

---

## 13. Verify Everything Works

Open in your browser:

```
https://quizify.cloud
```

Test the API directly from your machine:

```bash
curl https://quizify.cloud/api/learn
```

---

## Updating After a Code Push

Run this every time you push new commits:

```bash
cd /var/www/easy_learning
git pull origin main

# If client code changed — rebuild
cd client && npm install && npm run build

# If server code changed — restart API
cd ../server && npm install && pm2 restart easy-learn-api
```

---

## Quick Reference

| What | Location |
|------|----------|
| React build output | `/var/www/easy_learning/client/dist/` |
| Express API | `localhost:5000` (PM2 process: `easy-learn-api`) |
| Nginx config | `/etc/nginx/sites-available/easy-learn` |
| Server env file | `/var/www/easy_learning/server/.env` |
| Client env file | `/var/www/easy_learning/client/.env` |
| PM2 logs | `pm2 logs easy-learn-api` |
| Nginx error log | `/var/log/nginx/error.log` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page / 404 | Check `client/dist/` exists; confirm `try_files` line in Nginx config |
| API returns 502 Bad Gateway | PM2 is down → `pm2 restart easy-learn-api` |
| CORS error in browser | `CLIENT_URL` in `server/.env` must exactly match the browser origin (`https://quizify.cloud`) |
| Google sign-in fails | Add `quizify.cloud` to Firebase Console → Authentication → Authorized Domains |
| MongoDB connection refused | Add `quizify.cloud` to MongoDB Atlas → Network Access → IP Allowlist |
| `npm run build` fails | Confirm `client/.env` has `VITE_FIREBASE_API_KEY` set |
