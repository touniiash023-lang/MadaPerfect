import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    // mot de passe ici
    if (password === "TONY0987654321") {
      localStorage.setItem("mp_logged", "yes");
      onLogin();
    } else {
      alert("Mot de passe incorrect !");
    }
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f3f3f3"
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Connexion</h2>

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc"
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Connexion
        </button>
      </form>
    </div>
  );
}
