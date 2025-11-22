// src/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await cred.user.getIdTokenResult(true);
      const role = idTokenResult?.claims?.role || "employe";
      onLogin({ uid: cred.user.uid, email: cred.user.email, role });
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Connexion</h2>
        {err && <div className="mb-3 text-red-600">{err}</div>}
        <input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded mb-3"/>
        <input required value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full px-3 py-2 border rounded mb-4"/>
        <button disabled={busy} className="w-full bg-indigo-600 text-white py-2 rounded">
          {busy ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
