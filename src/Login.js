// src/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { getIdTokenResult } from "firebase/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await getIdTokenResult(userCredential.user, /* forceRefresh= */ true);
      const role = idTokenResult.claims?.role || null;
      // store minimal session in localStorage
      localStorage.setItem("mp_logged", "yes");
      localStorage.setItem("mp_userEmail", email);
      localStorage.setItem("mp_userRole", role || "employe");
      onLogin?.();
    } catch (error) {
      console.error(error);
      setErr("Erreur connexion: " + (error.message || error.code));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-semibold mb-4">Connexion</h2>
        {err && <div className="text-red-600 mb-3">{err}</div>}
        <label className="block mb-2">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <label className="block mb-2">Mot de passe</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" />
        <button className="w-full bg-indigo-600 text-white py-2 rounded">Se connecter</button>
        <p className="text-xs text-gray-500 mt-3">Utiliser les comptes fournis (superadmin/commercial)</p>
      </form>
    </div>
  );
}
