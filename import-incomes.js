const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json'); // 🔐 szolgáltatási fiók kulcs

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const data = require('./firestore_incomes.json');

(async () => {
  for (const income of Object.values(data)) {
    income.date = new Date(income.date); // dátum átalakítás Firestore számára
    await db.collection('incomes').add(income); // automatikus dokumentum ID generálás
    console.log(`✔ Bevétel feltöltve: ${income.title}`);
  }
})();