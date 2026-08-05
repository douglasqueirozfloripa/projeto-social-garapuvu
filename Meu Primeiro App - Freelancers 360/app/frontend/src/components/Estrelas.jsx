// Estrelas.jsx — Componente de nota por estrelas (1 a 5).
// Props:
//  - valor: number (0 a 5) — quantas estrelas ficam preenchidas.
//  - onChange?: (nota:number)=>void — se passado, permite clicar para escolher.
//  - somenteLeitura?: boolean — desativa o clique (ex.: exibir média no perfil).
export default function Estrelas({ valor = 0, onChange, somenteLeitura = false }) {
  const estrelas = [1, 2, 3, 4, 5];
  return (
    <div className="estrelas" role="group" aria-label="Nota de 1 a 5">
      {estrelas.map((n) => {
        const preenchida = n <= Math.round(valor);
        const clicavel = !!onChange && !somenteLeitura;
        return (
          <button
            key={n}
            type="button"
            data-testid={`estrela-${n}`}
            className={"estrela" + (preenchida ? " on" : "")}
            aria-pressed={preenchida}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            disabled={!clicavel}
            onClick={() => clicavel && onChange(n)}
          >
            {preenchida ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
