// painel.js — Cálculos do painel inicial (dashboard).
//
// São funções PURAS: recebem a lista de contratos e o usuário logado, devolvem
// números e textos. Nenhuma chamada de API, nenhum React. Por isso ficam na
// BASE da pirâmide de testes — dá para cobrir todos os casos sem renderizar
// tela nem subir o backend (ver painel.test.js).
//
// A regra de negócio de status vive no backend; aqui só CONTAMOS o que ele
// devolveu, sempre pelo ponto de vista de quem está logado.

const EM_PROCESSO = ["em_aprovacao", "em_andamento"];

// Um projeto está "entregue" quando o freelancer já enviou a avaliação dele:
// é o gatilho para o contratante concluir. Mesma leitura que Projetos.jsx faz.
const freelancerEntregou = (c) =>
  !!c.freelancerId && (c.avaliadores || []).includes(c.freelancerId);

/**
 * Os quatro números do topo do painel.
 * @returns {{id:string, rotulo:string, valor:number, dica:string}[]}
 */
export function resumoDoPainel(contratos = [], user) {
  if (!user) return [];
  return user.papel === "contratante"
    ? resumoContratante(contratos, user)
    : resumoFreelancer(contratos, user);
}

function resumoContratante(contratos, user) {
  const meus = contratos.filter((c) => c.contratanteId === user.id);
  const abertos = meus.filter((c) => c.status === "aberto");
  const candidaturas = abertos.reduce((total, c) => total + (c.candidatos || []).length, 0);

  return [
    { id: "publicados", rotulo: "Projetos publicados", valor: abertos.length, dica: "Recebendo candidaturas" },
    { id: "candidaturas", rotulo: "Candidaturas recebidas", valor: candidaturas, dica: "Nos projetos publicados" },
    { id: "em-processo", rotulo: "Em processo", valor: meus.filter((c) => EM_PROCESSO.includes(c.status)).length, dica: "Selecionado ou em andamento" },
    { id: "concluidos", rotulo: "Concluídos", valor: meus.filter((c) => c.status === "concluido").length, dica: "Com avaliação 360" },
  ];
}

function resumoFreelancer(contratos, user) {
  const meus = contratos.filter((c) => c.freelancerId === user.id);

  return [
    { id: "vagas", rotulo: "Vagas abertas", valor: contratos.filter((c) => c.status === "aberto").length, dica: "Publicadas na plataforma" },
    { id: "candidaturas", rotulo: "Minhas candidaturas", valor: contratos.filter((c) => (c.candidatos || []).includes(user.id)).length, dica: "Aguardando resposta" },
    { id: "em-processo", rotulo: "Em processo", valor: meus.filter((c) => EM_PROCESSO.includes(c.status)).length, dica: "Você foi selecionado" },
    { id: "concluidos", rotulo: "Trabalhos concluídos", valor: meus.filter((c) => c.status === "concluido").length, dica: "Com avaliação 360" },
  ];
}

/**
 * A ÚNICA coisa mais útil que a pessoa pode fazer agora.
 * A ordem das verificações é a prioridade: o que trava o fluxo de outra pessoa
 * vem antes do que só depende de quem está logado.
 * @returns {{texto:string, rotuloAcao:string, modulo:string}|null}
 */
export function proximoPasso(contratos = [], user) {
  if (!user) return null;
  return user.papel === "contratante"
    ? passoContratante(contratos, user)
    : passoFreelancer(contratos, user);
}

const paraProjetos = (texto, rotuloAcao = "Ir para Projetos") => ({ texto, rotuloAcao, modulo: "projetos" });

function passoContratante(contratos, user) {
  const meus = contratos.filter((c) => c.contratanteId === user.id);

  if (meus.length === 0)
    return paraProjetos("Publique seu primeiro projeto para começar a receber candidaturas.", "Publicar projeto");

  // 1º) freelancer já entregou e espera o contratante concluir
  const entregue = meus.find((c) => c.status === "em_andamento" && freelancerEntregou(c));
  if (entregue) return paraProjetos(`“${entregue.titulo}”: o freelancer entregou o trabalho. Conclua e avalie.`, "Concluir projeto");

  // 2º) candidato selecionado, faltando fechar o acordo
  const aprovacao = meus.find((c) => c.status === "em_aprovacao");
  if (aprovacao) return paraProjetos(`“${aprovacao.titulo}”: candidato selecionado. Feche o acordo para iniciar.`, "Iniciar trabalho");

  // 3º) gente esperando ser escolhida
  const comCandidatos = meus.filter((c) => c.status === "aberto" && (c.candidatos || []).length > 0);
  if (comCandidatos.length > 0) {
    const total = comCandidatos.reduce((t, c) => t + c.candidatos.length, 0);
    return paraProjetos(
      `${total} ${total === 1 ? "candidato espera" : "candidatos esperam"} sua escolha em ${comCandidatos.length} ${comCandidatos.length === 1 ? "projeto" : "projetos"}.`,
      "Ver candidatos",
    );
  }

  if (meus.some((c) => c.status === "em_andamento"))
    return paraProjetos("Trabalho em andamento. Aguardando o freelancer finalizar e enviar o feedback.", "Acompanhar projetos");

  return paraProjetos("Nenhuma candidatura por enquanto. Publique um novo projeto para ampliar o alcance.", "Publicar projeto");
}

function passoFreelancer(contratos, user) {
  const meus = contratos.filter((c) => c.freelancerId === user.id);

  // 1º) trabalho em andamento sem o feedback enviado: trava a conclusão do contratante
  const entregar = meus.find((c) => c.status === "em_andamento" && !(c.avaliadores || []).includes(user.id));
  if (entregar) return paraProjetos(`“${entregar.titulo}”: finalize o trabalho e envie o feedback ao contratante.`, "Finalizar trabalho");

  const selecionado = meus.find((c) => c.status === "em_aprovacao");
  if (selecionado) return paraProjetos(`Você foi selecionado em “${selecionado.titulo}”! O contratante vai fechar o acordo.`, "Ver projeto");

  const disponiveis = contratos.filter((c) => c.status === "aberto" && !(c.candidatos || []).includes(user.id));
  if (disponiveis.length > 0)
    return paraProjetos(
      `${disponiveis.length} ${disponiveis.length === 1 ? "vaga aberta espera" : "vagas abertas esperam"} sua candidatura.`,
      "Ver vagas",
    );

  if (contratos.some((c) => c.status === "aberto" && (c.candidatos || []).includes(user.id)))
    return paraProjetos("Candidaturas enviadas ✓ — aguardando a escolha dos contratantes.", "Acompanhar candidaturas");

  return {
    texto: "Nenhuma vaga aberta agora. Mantenha seu perfil completo para ganhar reputação.",
    rotuloAcao: "Ir para Meu perfil",
    modulo: "perfil",
  };
}
