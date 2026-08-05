// Contador TOTAL de visitantes (acumulado), em tempo real via Firestore.
//
// Como funciona:
//  • Existe um único documento `stats/visits` com o campo numérico `count`.
//  • Na primeira visita de cada navegador, incrementamos `count` em 1
//    (usando `increment`, operação atômica do Firestore — não há corrida
//    mesmo com várias pessoas entrando ao mesmo tempo).
//  • Um `onSnapshot` escuta esse documento e atualiza o número na tela em
//    tempo real conforme novas pessoas vão visitando.
//
// Usamos localStorage pra contar VISITANTES (um por navegador), não recargas
// de página. Se preferir contar todo acesso/recarregamento, é só remover a
// trava de localStorage.
import { useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";

const VISITED_KEY = "gp_visited";

export default function useVisitorCount() {
  // null = ainda carregando ou indisponível; número = total de visitantes.
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!db || typeof window === "undefined") return;

    const ref = doc(db, "stats", "visits");
    let alive = true;

    // Conta este visitante só uma vez por navegador.
    let alreadyCounted = false;
    try {
      alreadyCounted = window.localStorage.getItem(VISITED_KEY) === "1";
    } catch {
      /* localStorage indisponível (modo privado etc.) — segue sem a trava. */
    }

    if (!alreadyCounted) {
      setDoc(ref, { count: increment(1) }, { merge: true })
        .then(() => {
          try {
            window.localStorage.setItem(VISITED_KEY, "1");
          } catch {
            /* ignora */
          }
        })
        .catch(() => {
          /* falha de rede/permissão — apenas não incrementa. */
        });
    }

    // Escuta o total e atualiza em tempo real.
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!alive) return;
        const value = snap.exists() ? snap.data().count : 0;
        if (typeof value === "number") setCount(value);
      },
      () => {
        if (alive) setCount(null);
      }
    );

    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return count;
}
