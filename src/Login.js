// src/Login.js
import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Identifiants incorrects");
        return;
      }

      const userDoc = snap.docs[0].data();
      const role = userDoc.role || "employee";

      // store login info locally
      localStorage.setItem("mp_logged", "yes");
      localStorage.setItem("mp_role", role);
      localStorage.setItem("mp_email", userDoc.email || "");

      // callback to parent
      onLogin({ role, email: userDoc.email || "" });
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la connexion");
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow w-96"
      >
        <h2 className="text-2xl font-bold mb-4">Connexion</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />

        {error && <div className="text-red-500 mb-3">{error}</div>}

        <button className="w-full bg-indigo-600 text-white py-2 rounded">
          Connexion
        </button>
      </form>
    </div>
  );
}
