/**
 * Auto-detect local network IP and update .env before Expo starts.
 * Runs as a pre-start script so the mobile app always connects
 * to the correct backend IP — no manual editing needed.
 */
const os = require('os');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const BACKEND_PORT = 8000;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  // Priority order: Wi-Fi > Ethernet > any non-internal IPv4
  const priority = ['Wi-Fi', 'WiFi', 'WLAN', 'Wireless', 'Ethernet', 'eth0', 'en0'];

  for (const name of priority) {
    const iface = interfaces[name];
    if (iface) {
      const v4 = iface.find((i) => i.family === 'IPv4' && !i.internal);
      if (v4) return v4.address;
    }
  }

  // Fallback: first non-internal IPv4 from any interface
  for (const [, iface] of Object.entries(interfaces)) {
    const v4 = iface.find((i) => i.family === 'IPv4' && !i.internal);
    if (v4) return v4.address;
  }

  return 'localhost';
}

function updateEnv(ip) {
  const newUrl = `http://${ip}:${BACKEND_PORT}`;

  if (!fs.existsSync(ENV_FILE)) {
    // Create a minimal .env if it doesn't exist
    fs.writeFileSync(ENV_FILE, `EXPO_PUBLIC_API_BASE_URL=${newUrl}\n`, 'utf-8');
    console.log(`✅ Created .env with API URL: ${newUrl}`);
    return;
  }

  let content = fs.readFileSync(ENV_FILE, 'utf-8');
  const regex = /^EXPO_PUBLIC_API_BASE_URL=.*$/m;

  if (regex.test(content)) {
    const oldMatch = content.match(regex)[0];
    const oldUrl = oldMatch.split('=')[1];

    if (oldUrl === newUrl) {
      console.log(`✅ API URL already up-to-date: ${newUrl}`);
      return;
    }

    content = content.replace(regex, `EXPO_PUBLIC_API_BASE_URL=${newUrl}`);
    console.log(`🔄 Updated API URL: ${oldUrl} → ${newUrl}`);
  } else {
    content = `EXPO_PUBLIC_API_BASE_URL=${newUrl}\n` + content;
    console.log(`✅ Added API URL: ${newUrl}`);
  }

  fs.writeFileSync(ENV_FILE, content, 'utf-8');
}

const ip = getLocalIp();
console.log(`📡 Detected local IP: ${ip}`);
updateEnv(ip);
