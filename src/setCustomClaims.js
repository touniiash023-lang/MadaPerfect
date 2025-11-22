// setCustomClaims.js
// Usage: node setCustomClaims.js user@example.com admin
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node setCustomClaims.js user@example.com role");
  process.exit(1);
}
const email = args[0];
const role = args[1];

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });

(async () => {
  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, { role });
    console.log(`Rôle '${role}' ajouté à ${email}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
