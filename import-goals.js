const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json'); // 🔐 szolgáltatási fiók kulcs

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const data = require('./firestore_goals.json');

(async () => {
  for (const goal of Object.values(data)) {
    goal.targetDate = new Date(goal.targetDate); // ← fontos!
    await db.collection('goals').add(goal);
    console.log(`✔ Cél feltöltve: ${goal.title}`);
  }
})();