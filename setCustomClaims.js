// setCustomClaims.js
// Node script pour assigner custom claims role (admin/employee)
// Usage: node setCustomClaims.js email role
// Ex: node setCustomClaims.js admin@exemple.com admin

const admin = require("firebase-admin");
const path = require("path");

const keyPath = path.resolve(__dirname, "serviceAccountKey.json"); // place ton JSON ici
admin.initializeApp({
  credential: admin.credential.cert(require(keyPath))
});

const auth = admin.auth();

async function setRole(email, role) {
  try {
    const user = await auth.getUserByEmail(email);
    console.log("UID:", user.uid);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`Role ${role} assigné à ${email}`);
    console.log("NB: l'utilisateur doit se reconnecter pour que le token soit mis à jour.");
  } catch (err) {
    console.error(err);
  }
}

const [,, email, role] = process.argv;
if (!email || !role) {
  console.log("Usage: node setCustomClaims.js email role");
  process.exit(1);
}

setRole(email, role);
