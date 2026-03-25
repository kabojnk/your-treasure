# Build & Deploy Guide

Complete setup instructions for deploying **I'll Be Your Treasure** on a Digital Ocean droplet with Docker, Supabase, Google Maps, and Bunny.net CDN.

---

## 1. Supabase Setup

### Create a project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New Project**.
3. Choose an organization, give the project a name (e.g., `your-treasure`), set a strong database password, and pick a region close to you.
4. Wait for the project to finish provisioning.

### Get your credentials

1. In the Supabase dashboard, go to **Project Settings > API**.
2. Copy these two values — you'll need them for `.env`:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

### Run the schema

1. In the Supabase dashboard, go to **SQL Editor**.
2. Paste the contents of `supabase/schema.sql` and click **Run**.
   - This creates the `field_guides`, `bookmarks`, and `bookmark_tags` tables with indexes, triggers, and Row Level Security policies.

### If upgrading from a previous version

If you already have a `bookmarks` table and are adding field guide support:

1. Go to **SQL Editor**.
2. Paste and run the contents of `supabase/migration_002_field_guides.sql`.
   - This creates the `field_guides` table, adds the `field_guide_id` column to `bookmarks`, creates a default "PNW Trip" field guide for every existing user, and links all existing bookmarks to it. No data is lost.

### Create your first user

1. Go to **Authentication > Users** in the Supabase dashboard.
2. Click **Add User > Create New User**.
3. Enter an email and password. This will be your login.

---

## 2. Google Maps Setup

### Create an API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. Go to **APIs & Services > Library** and enable:
   - **Maps JavaScript API**
   - **Places API (New)**
4. Go to **APIs & Services > Credentials** and click **Create Credentials > API Key**.
5. Copy the key → `VITE_GOOGLE_MAPS_API_KEY`.
6. (Recommended) Restrict the key to your domain under **Application restrictions > HTTP referrers**.

### Create a Map ID

1. Go to the [Google Maps Platform > Map Management](https://console.cloud.google.com/google/maps-apis/studio/maps).
2. Click **Create Map ID**.
3. Set the map type to **JavaScript** and choose a style (or use the default).
4. Copy the Map ID → `VITE_GOOGLE_MAPS_MAP_ID`.

---

## 3. Bunny.net CDN Setup (Optional)

This enables image uploads for field guide avatars. If you skip this, users can still paste image URLs manually.

### Create a storage zone

1. Sign up at [bunny.net](https://bunny.net).
2. Go to **Storage > Add Storage Zone**.
3. Name it (e.g., `your-treasure-images`) and pick a region.
4. Copy the storage zone name → `VITE_BUNNY_STORAGE_ZONE`.

### Get the storage API key

1. In the storage zone settings, find the **Password / API Key**.
2. Copy it → `VITE_BUNNY_STORAGE_API_KEY`.

### Create a pull zone

1. Go to **CDN > Add Pull Zone**.
2. Connect it to your storage zone as the origin.
3. Copy the pull zone URL (e.g., `https://your-treasure.b-cdn.net`) → `VITE_BUNNY_CDN_URL`.

### CORS configuration

1. In your pull zone settings, go to **Headers**.
2. Enable the **Add CORS headers** toggle (green checkmark).
3. Make sure the extension list includes image formats: `jpg, jpeg, png, gif, webp, svg`.

---

## 4. Digital Ocean Droplet Setup

### Create the droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com).
2. Click **Create > Droplets**.
3. Choose:
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic, 1 GB RAM / 1 vCPU ($6/mo) is sufficient
   - **Region:** Whichever is closest to you
   - **Authentication:** SSH key (recommended) or password
4. Click **Create Droplet** and note the IP address.

### Install Docker

SSH into your droplet and run:

```bash
ssh root@YOUR_DROPLET_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### Clone the repo and configure

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/your-treasure.git
cd your-treasure

# Create the .env file
cp .env.example .env
nano .env
```

Fill in all the values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_GOOGLE_MAPS_MAP_ID=your-google-maps-map-id
VITE_BUNNY_STORAGE_ZONE=your-storage-zone-name
VITE_BUNNY_STORAGE_API_KEY=your-storage-api-key
VITE_BUNNY_CDN_URL=https://your-pullzone.b-cdn.net
DOMAIN=yourdomain.com
```

### Build and run

```bash
docker compose up -d --build
```

The app is now running on port 80. Visit `http://YOUR_DROPLET_IP` in your browser.

### Verify it's running

```bash
docker compose ps
docker compose logs -f web
```

---

## 5. Set Up a Domain with HTTPS

SSL is handled automatically by **Caddy**, which is included in the Docker Compose stack. Caddy provisions and renews Let's Encrypt certificates with zero configuration.

### Point your domain

1. In your domain registrar, add an **A record** pointing to your droplet's IP address.
   - Example: `illbeyourtreasure.com` → `YOUR_DROPLET_IP`
2. (Optional) Add a **CNAME** for `www` pointing to `illbeyourtreasure.com`.
3. Wait for DNS propagation (usually a few minutes).

### Configure the domain

Set the `DOMAIN` variable in your `.env` file:

```
DOMAIN=illbeyourtreasure.com
```

That's it. When you run `docker compose up -d --build`, Caddy will:

- Automatically obtain a Let's Encrypt TLS certificate for your domain
- Serve the app over HTTPS on port 443
- Redirect all HTTP (port 80) traffic to HTTPS
- Auto-renew the certificate before it expires

### Verify HTTPS is working

```bash
# Check that Caddy obtained the certificate
docker compose logs caddy

# Visit your site
curl -I https://illbeyourtreasure.com
```

### Troubleshooting

- **Certificate not provisioning?** Make sure ports 80 and 443 are open on the droplet firewall (`ufw allow 80 && ufw allow 443`).
- **DNS not resolving?** Verify the A record is set correctly: `dig illbeyourtreasure.com`.
- **Caddy logs:** `docker compose logs -f caddy`

---

## 6. Updating the App

SSH into your droplet and pull the latest changes:

```bash
cd your-treasure
git pull
docker compose up -d --build
```

Docker will rebuild only what changed and restart the container.

---

## Quick Reference

| Variable | Source | Required |
|----------|--------|----------|
| `VITE_SUPABASE_URL` | Supabase dashboard > Project Settings > API | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard > Project Settings > API | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console > Credentials | Yes |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Platform > Map Management | Yes |
| `VITE_BUNNY_STORAGE_ZONE` | Bunny.net > Storage > Zone name | No |
| `VITE_BUNNY_STORAGE_API_KEY` | Bunny.net > Storage > Zone settings | No |
| `VITE_BUNNY_CDN_URL` | Bunny.net > CDN > Pull zone URL | No |
| `DOMAIN` | Your domain name (e.g., `illbeyourtreasure.com`) | No (defaults to `localhost`) |

| Command | Purpose |
|---------|---------|
| `docker compose up -d --build` | Build and start the app |
| `docker compose down` | Stop the app |
| `docker compose logs -f web` | Tail app logs |
| `docker compose logs -f caddy` | Tail Caddy/SSL logs |
| `docker compose ps` | Check status |
