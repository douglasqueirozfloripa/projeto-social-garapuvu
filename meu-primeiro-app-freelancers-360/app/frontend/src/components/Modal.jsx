// Modal.jsx — Janela sobreposta reutilizável. Fecha no X ou clicando fora.
export default function Modal({ titulo, aoFechar, children }) {
  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal" role="dialog" aria-modal="true" data-testid="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{titulo}</h2>
          <button className="fechar" aria-label="Fechar" data-testid="modal-fechar" onClick={aoFechar}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
