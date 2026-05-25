import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Path to the service account key
const serviceAccountPath = '/Users/andi/Downloads/turnamen-layangan-firebase-adminsdk-fbsvc-4644caaf1e.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account key not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupSubcollections(docRef, subcollectionsObj) {
  const subcollections = await docRef.listCollections();
  for (const subcol of subcollections) {
    const subcolId = subcol.id;
    subcollectionsObj[subcolId] = {};
    
    // Use listDocuments to find all document references, including fieldless parent documents
    const docRefs = await subcol.listDocuments();
    for (const dRef of docRefs) {
      const docId = dRef.id;
      const docSnap = await dRef.get();
      
      subcollectionsObj[subcolId][docId] = {
        exists: docSnap.exists,
        data: docSnap.exists ? docSnap.data() : null,
        subcollections: {}
      };
      
      // Recurse into subcollections of this document
      await backupSubcollections(dRef, subcollectionsObj[subcolId][docId].subcollections);
    }
  }
}

async function backup() {
  console.log("Starting deep recursive Firestore backup...");
  const backupData = {};

  // Retrieve all root collections
  const collections = await db.listCollections();
  
  for (const collection of collections) {
    const colId = collection.id;
    console.log(`Backing up collection: ${colId}...`);
    backupData[colId] = {};
    
    // Retrieve all document references in root collection
    const docRefs = await collection.listDocuments();
    for (const dRef of docRefs) {
      const docId = dRef.id;
      const docSnap = await dRef.get();
      
      backupData[colId][docId] = {
        exists: docSnap.exists,
        data: docSnap.exists ? docSnap.data() : null,
        subcollections: {}
      };
      
      // Read subcollections (recursive)
      await backupSubcollections(dRef, backupData[colId][docId].subcollections);
    }
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `firestore_backup_${serviceAccount.project_id}_${dateStr}.json`;
  const outputPath = path.join(process.cwd(), filename);
  
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log("\n==================================================");
  console.log("✅ Deep Backup completed successfully!");
  console.log(`📂 Saved to: ${outputPath}`);
  console.log("==================================================");
}

backup().catch(err => {
  console.error("❌ Backup failed:", err);
  process.exit(1);
});
