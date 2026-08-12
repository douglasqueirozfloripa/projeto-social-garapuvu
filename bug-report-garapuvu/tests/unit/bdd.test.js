/**
 * Testes unitários do gerador de cenário BDD (frontend/js/bdd.js).
 */

const { gerarBdd, limparLinha, emLinhas } = require('../../frontend/js/bdd.js');

const bugCompleto = {
  titulo: 'Botão de login não responde no Safari',
  prerequisitos: "1. Feature flag 'novo-login' ativa\n2. Usuário com perfil Administrador",
  passos: '1. Acesse a página inicial\n2. Clique em "Entrar"\n3. Informe as credenciais',
  esperado: 'O painel inicial deve ser exibido',
  obtido: 'A tela fica em branco',
  severidade: 'alta',
  prioridade: 'media',
  ambiente: 'macOS · Safari 17'
};

describe('limparLinha', () => {
  it('remove numeração e bullets', () => {
    expect(limparLinha('1. Acesse a home')).toBe('Acesse a home');
    expect(limparLinha('2) Clique no botão')).toBe('Clique no botão');
    expect(limparLinha('- Faça login')).toBe('Faça login');
    expect(limparLinha('• Abra o menu')).toBe('Abra o menu');
  });

  it('remove palavras-chave Gherkin já digitadas para não duplicar', () => {
    expect(limparLinha('Quando eu clico em Entrar')).toBe('eu clico em Entrar');
    expect(limparLinha('Dado que estou logado')).toBe('estou logado');
    expect(limparLinha('E vejo o painel')).toBe('vejo o painel');
    expect(limparLinha('Given I am logged in')).toBe('I am logged in');
  });

  it('não confunde palavra-chave com o início de uma palavra comum', () => {
    expect(limparLinha('Envie o formulário')).toBe('Envie o formulário');
    expect(limparLinha('Editar o cadastro')).toBe('Editar o cadastro');
  });

  it('aceita entradas vazias ou nulas', () => {
    expect(limparLinha('')).toBe('');
    expect(limparLinha(null)).toBe('');
    expect(limparLinha(undefined)).toBe('');
  });
});

describe('emLinhas', () => {
  it('quebra em linhas limpas e descarta as vazias', () => {
    expect(emLinhas('1. um\n\n2. dois\n   \n3. três')).toEqual(['um', 'dois', 'três']);
  });

  it('funciona com quebras de linha do Windows', () => {
    expect(emLinhas('um\r\ndois')).toEqual(['um', 'dois']);
  });

  it('devolve lista vazia para texto ausente', () => {
    expect(emLinhas('')).toEqual([]);
    expect(emLinhas(null)).toEqual([]);
  });
});

describe('gerarBdd', () => {
  it('traduz pré-requisitos em "Dado que" e "E"', () => {
    const cenario = gerarBdd(bugCompleto);
    expect(cenario).toContain("Dado que Feature flag 'novo-login' ativa");
    expect(cenario).toContain('E Usuário com perfil Administrador');
  });

  it('traduz o primeiro passo em "Quando" e os demais em "E"', () => {
    const cenario = gerarBdd(bugCompleto);
    expect(cenario).toContain('Quando Acesse a página inicial');
    expect(cenario).toContain('E Clique em "Entrar"');
    expect(cenario).toContain('E Informe as credenciais');
  });

  it('traduz o resultado esperado em "Então"', () => {
    expect(gerarBdd(bugCompleto)).toContain('Então O painel inicial deve ser exibido');
  });

  it('registra o resultado obtido como comentário, não como asserção', () => {
    const cenario = gerarBdd(bugCompleto);
    expect(cenario).toContain('# ⚠️ Resultado obtido hoje (bug): A tela fica em branco');
    expect(cenario).not.toContain('Então A tela fica em branco');
  });

  it('inclui cabeçalho, funcionalidade, ambiente e etiquetas', () => {
    const cenario = gerarBdd(bugCompleto);
    expect(cenario.startsWith('# language: pt')).toBe(true);
    expect(cenario).toContain('Funcionalidade: Botão de login não responde no Safari');
    expect(cenario).toContain('# Ambiente: macOS · Safari 17');
    expect(cenario).toContain('@bug @sev-alta @prio-media');
    expect(cenario).toContain('Cenário: Botão de login não responde no Safari');
  });

  it('omite o bloco "Dado que" quando não há pré-requisitos', () => {
    const cenario = gerarBdd({ ...bugCompleto, prerequisitos: '' });
    expect(cenario).not.toContain('Dado que');
    expect(cenario).toContain('Quando Acesse a página inicial');
  });

  it('marca TODO quando faltam passos ou resultado esperado', () => {
    const cenario = gerarBdd({ titulo: 'Bug sem detalhes' });
    expect(cenario).toContain('# TODO: descreva os passos para reproduzir');
    expect(cenario).toContain('# TODO: descreva o resultado esperado');
  });

  it('usa título padrão e não quebra sem argumento', () => {
    expect(gerarBdd()).toContain('Funcionalidade: Cenário sem título');
    expect(gerarBdd(null)).toContain('Cenário: Cenário sem título');
  });

  it('mantém a indentação de 4 espaços nos passos', () => {
    const linhas = gerarBdd(bugCompleto).split('\n');
    const linhaQuando = linhas.find((l) => l.includes('Quando'));
    expect(linhaQuando).toBe('    Quando Acesse a página inicial');
  });
});
