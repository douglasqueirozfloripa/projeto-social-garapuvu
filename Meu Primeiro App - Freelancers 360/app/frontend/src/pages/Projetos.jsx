// Projetos.jsx — Fluxo completo do projeto (MVP de recrutamento).
// Contratante: publica, vê candidatos (com reputação), seleciona, fecha o acordo
//   (WhatsApp), acompanha o andamento e conclui avaliando o freelancer.
// Freelancer: vê os projetos abertos, candidata-se e, quando selecionado,
//   entrega o trabalho enviando o feedback (avaliação 360) ao contratante.
// Status: aberto (Publicado) → em_aprovacao → em_andamento → concluido.
import { useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import Estrelas from "../components/Estrelas.jsx";
import Avaliar from "./Avaliar.jsx";
import useFlags from "../hooks/useFlags.js";

const rotulo = { aberto: "Publicado", em_aprovacao: "Em aprovação", em_andamento: "Em andamento", concluido: "Concluído" };

export default function Projetos({ user }) {
  const [contratos, setContratos] = useState([]);
  const [erro, setErro] = useState("");
  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState(null);       // projeto sendo editado
  const [verCandidatos, setVerCandidatos] = useState(null); // projeto cujos candidatos serão exibidos
  const [avaliando, setAvaliando] = useState(null);      // { contrato, deId, paraId, concluir }
  const ehContratante = user.papel === "contratante";
  const { ativa } = useFlags();
  const flagDestaque = ativa("pagamento_destaque"); // habilita destacar projeto

  async function carregar() {
    setErro("");
    try { setContratos(await api.listarContratos()); } catch (e) { setErro(e.message); }
  }
  useEffect(() => { carregar(); }, []);

  // Helper para chamadas simples que só recarregam a lista.
  async function acao(fn) {
    try { await fn(); carregar(); } catch (e) { setErro(e.message); }
  }

  async function excluir(c) {
    if (!window.confirm(`Excluir o projeto “${c.titulo}”? Esta ação não pode ser desfeita.`)) return;
    acao(() => api.removerContrato(c.id));
  }

  // Projetos visíveis por papel: contratante vê os seus; freelancer vê os abertos + os que participa.
  const visiveis = ehContratante
    ? contratos.filter((c) => c.contratanteId === user.id)
    : contratos.filter((c) => c.status === "aberto" || c.freelancerId === user.id);

  return (
    <div>
      <div className="projetos-head">
        <h2 style={{ margin: 0 }}>Projetos</h2>
        {ehContratante
          ? <button data-testid="novo-projeto" onClick={() => setModalNovo(true)}>+ Novo projeto</button>
          : <span className="badge aberto">Candidate-se aos projetos publicados</span>}
      </div>

      {erro && <p className="msg-erro">{erro}</p>}

      {visiveis.length === 0 && !erro && (
        <div className="vazio">
          {ehContratante ? "Nenhum projeto ainda. Clique em “+ Novo projeto”." : "Nenhum projeto publicado no momento."}
        </div>
      )}

      <div className="projetos-grid">
        {visiveis.map((c) => (
          <article className={`projeto-card${c.destaque ? " destacado" : ""}`} data-testid="projeto-card" key={c.id}>
            <span className={`badge ${c.status}`}>{rotulo[c.status] || c.status}</span>
            {c.destaque && <span className="badge destaque" data-testid="selo-destaque">★ Destaque</span>}
            <h3>{c.titulo}</h3>
            {c.descricao && <p className="descricao">{c.descricao}</p>}
            <p className="meta">
              Contratante #{c.contratanteId}
              {c.freelancerId ? ` · Freelancer #${c.freelancerId}` : " · Aguardando freelancer"}
            </p>
            {(c.email || c.telefone || c.endereco) && (
              <ul className="contato">
                {c.email && <li>✉️ {c.email}</li>}
                {c.telefone && <li>📞 {c.telefone}</li>}
                {c.endereco && <li>📍 {c.endereco}</li>}
              </ul>
            )}
            <div className="acoes">
              {ehContratante
                ? <AcoesContratante c={c} user={user} setVerCandidatos={setVerCandidatos} setEditando={setEditando} excluir={excluir} acao={acao} setAvaliando={setAvaliando} flagDestaque={flagDestaque} />
                : <AcoesFreelancer c={c} user={user} acao={acao} setAvaliando={setAvaliando} />}
            </div>
          </article>
        ))}
      </div>

      {modalNovo && (
        <Modal titulo="Novo projeto" aoFechar={() => setModalNovo(false)}>
          <ProjetoForm user={user} aoSalvar={() => { setModalNovo(false); carregar(); }} />
        </Modal>
      )}

      {editando && (
        <Modal titulo="Editar projeto" aoFechar={() => setEditando(null)}>
          <ProjetoForm user={user} projeto={editando} aoSalvar={() => { setEditando(null); carregar(); }} />
        </Modal>
      )}

      {verCandidatos && (
        <Modal titulo={`Candidatos · ${verCandidatos.titulo}`} aoFechar={() => setVerCandidatos(null)}>
          <Candidatos contrato={verCandidatos} aoSelecionar={() => { setVerCandidatos(null); carregar(); }} aoAtualizar={carregar} />
        </Modal>
      )}

      {avaliando && (
        <Modal titulo="Avaliação 360°" aoFechar={() => setAvaliando(null)}>
          <Avaliar
            {...avaliando}
            aoConcluir={async () => {
              try { if (avaliando.concluir) await api.concluirContrato(avaliando.contrato.id); }
              catch (e) { setErro(e.message); }
              setAvaliando(null); carregar();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// ---- Ações do CONTRATANTE (dono do projeto) ----
export function AcoesContratante({ c, user, setVerCandidatos, setEditando, excluir, acao, setAvaliando, flagDestaque }) {
  const nCandidatos = (c.candidatos || []).length;
  const freelancerEntregou = c.freelancerId && (c.avaliadores || []).includes(c.freelancerId);

  if (c.status === "aberto") {
    return (
      <>
        <button data-testid="ver-candidatos" onClick={() => setVerCandidatos(c)}>Ver candidatos ({nCandidatos})</button>
        <button className="secundario" data-testid="editar-projeto" onClick={() => setEditando(c)}>Editar</button>
        {/* Botão de destaque só aparece com a flag pagamento_destaque ligada. */}
        {flagDestaque && !c.destaque && (
          <button className="amarelo" data-testid="destacar-projeto" onClick={() => acao(() => api.destacarContrato(c.id))}>★ Destacar</button>
        )}
        <button className="perigo" data-testid="excluir-projeto" onClick={() => excluir(c)}>Excluir</button>
      </>
    );
  }
  if (c.status === "em_aprovacao") {
    return (
      <>
        <span className="dica">Freelancer #{c.freelancerId} selecionado. Combine o acordo pelo WhatsApp.</span>
        <button className="amarelo" data-testid="iniciar-andamento" onClick={() => acao(() => api.iniciarAndamento(c.id))}>Fechei o acordo → iniciar</button>
      </>
    );
  }
  if (c.status === "em_andamento") {
    return freelancerEntregou
      ? <button className="amarelo" data-testid="concluir-projeto" onClick={() => setAvaliando({ contrato: c, deId: user.id, paraId: c.freelancerId, concluir: true })}>Concluir e avaliar freelancer</button>
      : <span className="dica">Trabalho em andamento. Aguardando o freelancer finalizar e enviar o feedback.</span>;
  }
  return <span className="dica">Projeto concluído. ✔</span>;
}

// ---- Ações do FREELANCER ----
export function AcoesFreelancer({ c, user, acao, setAvaliando }) {
  const jaCandidatou = (c.candidatos || []).includes(user.id);
  const souSelecionado = c.freelancerId === user.id;
  const jaAvaliei = (c.avaliadores || []).includes(user.id);

  if (c.status === "aberto") {
    return jaCandidatou
      ? <>
          <span className="dica">Candidatura enviada ✓ — aguardando o contratante.</span>
          <button className="perigo" data-testid="retirar-candidatura" onClick={() => acao(() => api.removerCandidatura(c.id, user.id))}>Retirar candidatura</button>
        </>
      : <button data-testid="candidatar" onClick={() => acao(() => api.candidatar(c.id, user.id))}>Candidatar-se</button>;
  }
  if (!souSelecionado) return <span className="dica">Vaga já em processo com outro freelancer.</span>;
  if (c.status === "em_aprovacao") return <span className="dica">Você foi selecionado! 🎉 O contratante vai fechar o acordo pelo WhatsApp.</span>;
  if (c.status === "em_andamento") {
    return jaAvaliei
      ? <span className="dica">Feedback enviado ✓ — aguardando o contratante concluir.</span>
      : <button data-testid="finalizar-trabalho" onClick={() => setAvaliando({ contrato: c, deId: user.id, paraId: c.contratanteId, concluir: false })}>Finalizar trabalho e enviar feedback</button>;
  }
  return <span className="dica">Projeto concluído. ✔</span>;
}

// ---- Modal: lista de candidatos com reputação; contratante seleciona ou remove ----
function Candidatos({ contrato, aoSelecionar, aoAtualizar }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");

  async function carregarLista() {
    try { setLista(await api.listarCandidatos(contrato.id)); }
    catch (e) { setErro(e.message); }
  }
  useEffect(() => { carregarLista(); }, [contrato.id]);

  async function selecionar(freelancerId) {
    setErro("");
    try { await api.selecionarFreelancer(contrato.id, freelancerId); aoSelecionar(); }
    catch (e) { setErro(e.message); }
  }

  async function remover(freelancerId) {
    setErro("");
    try { await api.removerCandidatura(contrato.id, freelancerId); await carregarLista(); aoAtualizar(); }
    catch (e) { setErro(e.message); }
  }

  if (erro) return <p className="msg-erro">{erro}</p>;
  if (!lista) return <p className="meta">Carregando candidatos...</p>;
  if (lista.length === 0) return <p className="meta">Ninguém se candidatou ainda.</p>;

  return (
    <ul className="candidatos-lista">
      {lista.map((f) => (
        <li key={f.freelancerId} className="candidato" data-testid="candidato">
          <div>
            <b>{f.nome}</b> <span className="meta">#{f.freelancerId}</span>
            <div className="reputacao">
              <Estrelas valor={f.media} somenteLeitura />
              <span className="meta">{f.media} · {f.totalAvaliacoes} avaliação(ões)</span>
            </div>
          </div>
          <div className="candidato-acoes">
            <button data-testid={`selecionar-${f.freelancerId}`} onClick={() => selecionar(f.freelancerId)}>Selecionar</button>
            <button className="perigo" data-testid={`remover-candidato-${f.freelancerId}`} onClick={() => remover(f.freelancerId)}>Remover</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- Formulário reutilizável: sem `projeto` = criar; com `projeto` = editar ----
function ProjetoForm({ user, projeto, aoSalvar }) {
  const editar = !!projeto;
  const [titulo, setTitulo] = useState(projeto?.titulo ?? "");
  const [descricao, setDescricao] = useState(projeto?.descricao ?? "");
  const [endereco, setEndereco] = useState(projeto?.endereco ?? user.endereco ?? "");
  const [telefone, setTelefone] = useState(projeto?.telefone ?? user.telefone ?? "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro(""); setSalvando(true);
    try {
      if (editar) await api.atualizarContrato(projeto.id, { titulo, descricao, endereco, telefone });
      else await api.criarContrato({ titulo, descricao, contratanteId: user.id, endereco, telefone });
      aoSalvar();
    } catch (e) { setErro(e.message); setSalvando(false); }
  }

  return (
    <form onSubmit={salvar}>
      <label htmlFor="proj-titulo">Título do projeto</label>
      <input id="proj-titulo" data-testid="input-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ex.: Landing page para loja" />

      <label htmlFor="proj-descricao">Descrição do projeto</label>
      <textarea id="proj-descricao" data-testid="input-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} placeholder="Descreva o que precisa ser feito, prazos e o que espera do freelancer." />

      <label htmlFor="proj-telefone">Telefone para contato</label>
      <input id="proj-telefone" data-testid="input-telefone-projeto" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(48) 90000-0000" />

      <label htmlFor="proj-endereco">Endereço para contato</label>
      <input id="proj-endereco" data-testid="input-endereco-projeto" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Cidade/UF ou endereço" />

      <p className="meta">
        Contato do dono ({user.email}). Sugerimos telefone e endereço do seu perfil — ajuste se quiser um contato só para este projeto.
      </p>
      {erro && <p className="msg-erro">{erro}</p>}
      <div style={{ marginTop: 14 }}>
        <button type="submit" style={{ width: "100%" }} disabled={salvando} data-testid="salvar-projeto">
          {salvando ? "Salvando..." : editar ? "Salvar alterações" : "Criar projeto"}
        </button>
      </div>
    </form>
  );
}
