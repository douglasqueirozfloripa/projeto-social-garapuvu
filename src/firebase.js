// Configuração e inicialização do Firebase para o Projeto Social Garapuvu.
//
// OBS: Esta config do Firebase Web NÃO é segredo — ela fica no frontend e é
// visível para qualquer visitante. A segurança real vem das Security Rules
// (Firestore/Storage) e dos domínios autorizados no console do Firebase.
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Configuração do app web (gerada no console do Firebase).
// Para Firebase JS SDK v7.20.0+, measurementId é opcional.
const firebaseConfig = {
  apiKey: "AIzaSyD8GBexN5GHlCHd-dHPe1RKu-Pde-w_6Bg",
  authDomain: "projeto-garapuvu.firebaseapp.com",
  projectId: "projeto-garapuvu",
  storageBucket: "projeto-garapuvu.firebasestorage.app",
  messagingSenderId: "163985011689",
  appId: "1:163985011689:web:db7253bd94b85cc7fb5178",
  measurementId: "G-C7DJVDZ7NG",
};

// Inicializa o app Firebase.
const app = initializeApp(firebaseConfig);

// Firestore — usado pelo contador de visitantes online em tempo real.
const db = getFirestore(app);

// Analytics só roda no navegador e quando suportado (evita erros em SSR/build
// e em ambientes sem cookies/IndexedDB).
let analytics = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => {
      /* Analytics indisponível — segue sem rastreamento. */
    });
}

// Helper de rastreamento usado pela landing page. Faz no-op seguro enquanto o
// Analytics ainda não inicializou (ou não é suportado).
export function track(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  } else if (typeof console !== "undefined") {
    console.log("[analytics]", eventName, params);
  }
}

export { app, analytics, db };
export default app;
