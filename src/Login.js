import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getIdTokenResult } from "firebase/auth";

export default function Login({ onLogin, setRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = getAuth();

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const tokenResult = await getIdTokenResult(user);
      const role = tokenResult.claims.role || "employee";

      // Stocker localement
      localStorage.setItem("mp_logged", "yes");
      localStorage.setItem("mp_role", role);

      setRole(role);
      onLogin();

    } catch (err) {
      alert("Erreur de connexion : " + err.message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-6 bg-white rounded shadow w-80">
        <h2 className="text-xl font-bold mb-4">Connexion</h2>

        <input
          type="email"
          className="w-full p-2 border rounded mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          placeholder="Mot de passe"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-indigo-600 text-white py-2 rounded">
          Connexion
        </button>
      </form>
    </div>
  );
}
