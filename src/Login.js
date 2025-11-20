// PARTIE 1 - Login.js
// place ce fichier dans src/Login.js
import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple Login 1: vérifie collection "users" (doc par user, champs username/password)
  async function handleSubmit(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username),
        where("password", "==", password)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // ok
        localStorage.setItem("mp_logged", "yes");
        onLogin();
      } else {
        alert("Utilisateur ou mot de passe invalide.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-96 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Connexion MadaPerfect</h2>
        <label className="block text-sm">Identifiant</label>
        <input className="w-full border px-3 py-2 mb-3" value={username} onChange={e=>setUsername(e.target.value)} />
        <label className="block text-sm">Mot de passe</label>
        <input type="password" className="w-full border px-3 py-2 mb-4" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="flex justify-end">
          <button disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {loading ? "..." : "Se connecter"}
          </button>
        </div>
      </form>
    </div>
  );
}
