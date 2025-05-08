const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json'); // 🔐 ide tedd a letöltött kulcsot

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const data = require('./firestore_expenses.json');

(async () => {
  for (const [docId, docData] of Object.entries(data)) {
    // A dátum stringből konvertálunk Firestore Timestamp objektummá
    const timestamp = new Date(docData.date);
    await db.collection('expenses').doc(docId).set({
      ...docData,
      date: timestamp
    });
    console.log(`✔ Feltöltve: ${docId}`);
  }
})();