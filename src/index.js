
// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MadaPerfectApp from "./App";

// si tu as reportWebVitals, tu peux l'importer et l'utiliser (optionnel)
// import reportWebVitals from './reportWebVitals';

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MadaPerfectApp />
  </React.StrictMode>
);

// reportWebVitals();
