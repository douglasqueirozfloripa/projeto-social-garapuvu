import React from "react";
import { createRoot } from "react-dom/client";
import GarapuvuLanding from "./GarapuvuLanding.jsx";

// Inicializa o Firebase (e o Analytics, quando suportado) no boot do app.
import "./firebase.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GarapuvuLanding />
  </React.StrictMode>
);
