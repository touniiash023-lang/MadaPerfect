// setCustomClaims.js
import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setClaim(email, role) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role });
  console.log(`✔ Rôle "${role}" ajouté à ${email}`);
}

const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.log("Usage: node setCustomClaims.js email role");
  process.exit(1);
}

setClaim(email, role);
