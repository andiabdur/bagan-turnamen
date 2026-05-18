import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// 1. Parse .env.production.local manually (Zero-dependency)
const envPath = path.resolve('.env.production.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.production.local file not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

// 2. Initialize Firebase Client
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = env.VITE_APP_ID || 'default-app-id';

async function runBackup() {
  try {
    console.log("🔐 Menghubungkan ke Firebase...");
    await signInAnonymously(auth);
    console.log("✓ Berhasil terotentikasi!");

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournament', 'all_pools');
    console.log(`📥 Mengunduh data turnamen dengan App ID: "${appId}"...`);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `backup-${appId}-${dateStr}.json`;
      fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
      
      console.log(`\n========================================`);
      console.log(`✅ BACKUP BERHASIL!`);
      console.log(`📂 Disimpan sebagai: ${filename}`);
      console.log(`========================================`);
    } else {
      console.log(`\n❌ Gagal: Tidak ada data turnamen ditemukan untuk App ID "${appId}" di database!`);
    }
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Backup gagal dengan error:", error.message);
    process.exit(1);
  }
}

runBackup();
