// useFlags.js — Hook que lê as feature flags da API e diz se cada uma está ativa.
// Uso: const { ativa, flags, carregando, recarregar } = useFlags();
//      if (ativa("login_google")) { ...mostra o botão do Google... }
//
// Falha graciosa: se a API estiver fora, tratamos tudo como DESLIGADO — o app
// continua funcionando com o comportamento padrão (a flag some, não quebra).
import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";

export default function useFlags() {
  const [flags, setFlags] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try { setFlags(await api.listarFlags()); }
    catch { setFlags([]); }        // API fora → nenhuma flag ativa (comportamento padrão)
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  // Diz se uma flag está ligada (flag ausente = desligada).
  const ativa = useCallback((nome) => flags.some((f) => f.nome === nome && f.ativa), [flags]);

  return { flags, ativa, carregando, recarregar };
}
