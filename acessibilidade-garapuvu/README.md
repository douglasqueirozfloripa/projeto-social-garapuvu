# Acessibilidade Garapuvu — testes de interface com Playwright

Testes automatizados do site [projeto-garapuvu.web.app](https://projeto-garapuvu.web.app/)
nascidos do **12º encontro** (15/09/2026). Nesse encontro, o Abner Oliveira navegou pelo site
com o leitor de tela **NVDA** e encontrou três problemas: o foco se perdia ao acionar vídeos,
os controles do player sumiam e a leitura voltava para o topo depois dos botões.

A suíte cobre quatro frentes:

| Arquivo | Funcionalidade | O que verifica |
|---|---|---|
| `01-wcag-axe` | Conformidade WCAG 2.2 AA | axe-core nos temas escuro e claro, em cada módulo e depois de trocar o vídeo |
| `02-arvore-acessibilidade` | Árvore de acessibilidade | regiões, hierarquia de títulos, nomes de botões e links, imagem descrita, títulos dos vídeos, aviso de nova aba, idioma |
| `03-nvda-simulado` | Leitor de tela (NVDA simulado) | leitura com a seta, teclas H (títulos), D (regiões) e K (links), foco depois dos links do topo, escolha de encontro, módulos e troca de tema |
| `04-usabilidade-teclado` | Usabilidade com teclado | ordem do Tab no topo, Tab por todos os módulos, contorno de foco, alvos de 24 px, tema salvo, "reduzir movimento" |
| `05-layout-responsivo` | Layout | 320 px (zoom de 400%), 390, 768, 1280 e 1920 px, sem rolagem horizontal, espaçamento de texto (WCAG 1.4.12) |
| `06-navegacao-reversa-shift-tab` | Shift+Tab | a volta pela página inteira é o espelho exato do Tab; Shift+Tab testado em cada experiência (topo, tema, currículo, encontros, player tocando, rodapé) |

## Como rodar

```bash
cd acessibilidade-garapuvu
npm install
npx playwright install chromium   # só na primeira vez

npm test                 # suíte completa contra o build LOCAL (faz o build e sobe o preview sozinho)
npm run test:producao    # mesma suíte contra o site publicado
npm run test:nvda        # só o NVDA simulado (com voz)
npm run test:ao-vivo     # navegador visível + voz nos alto-falantes, passo a passo (bom para aula)
npm run test:ci          # sem voz e sem pausas (para CI)
npm run relatorio        # abre o relatório HTML
```

## Os vídeos

Cada cenário gera um vídeo em **`videos/<arquivo>/<cenário>.mp4`**. Cenários que falham ganham
o prefixo `[FALHOU]`. O vídeo mostra, sobre a página:

- a **funcionalidade** e o **cenário**;
- os passos **Dado / Quando / Então / E**, atualizados enquanto o teste roda:
  ▶ o passo atual, ✓ os concluídos, ✗ o que falhou (com a mensagem de erro) e ○ os que ainda vêm;
- o **Visualizador de fala** (como o do NVDA), com as últimas frases do leitor de tela simulado;
- o painel **Foco do teclado**, com cada parada do Tab e do Shift+Tab.

Nos cenários de leitor de tela, o vídeo tem **áudio**: cada frase é falada pela voz nativa do
macOS (`say`, voz Luciana) e colocada no instante em que foi dita. O teste espera cada frase
terminar antes de seguir, como alguém ouvindo o NVDA.

Os mesmos vídeos, os JSON do axe, a árvore de acessibilidade, as capturas de tela e o trace
ficam anexados ao relatório HTML (`npm run relatorio`).

| Variável | Efeito |
|---|---|
| `BASE_URL` | site a testar (padrão: build local em `http://localhost:4173`) |
| `AUDIO=0` | desliga a voz |
| `FALAR=1` | toca a voz ao vivo, além de gravá-la |
| `VOZ`, `VELOCIDADE` | voz do `say` e palavras por minuto (padrão: Luciana, 210) |
| `PASSO_MS` | pausa entre passos, para o vídeo ficar legível (padrão: 600; use 0 em CI) |

## Como funciona o "NVDA simulado"

O NVDA só roda no Windows. Aqui usamos o
[Virtual Screen Reader da Guidepup](https://github.com/guidepup/virtual-screen-reader), que
percorre a **mesma árvore de acessibilidade** que o Chromium entrega ao NVDA e gera as frases que
um leitor de tela falaria. Os comandos imitam o modo de navegação do NVDA (seta para baixo, H, D,
K, Enter), e o teclado real do Playwright dispara Tab, Shift+Tab e Enter na página. O leitor
acompanha o foco, como o NVDA acompanha.

As asserções usam as frases originais do leitor virtual. A legenda e a voz mostram uma tradução
para o português no estilo do NVDA ("título nível 2, …", "botão, …, expandido"), que é **uma
aproximação**, não o texto exato do NVDA.

> Esta suíte não substitui o teste com o NVDA de verdade e com quem usa leitor de tela no dia a
> dia. Ela garante que o que já foi corrigido continue corrigido. A próxima rodada com o Abner
> segue sendo a validação final.

Para ir além: `@guidepup/guidepup` controla o **VoiceOver** real no macOS (exige liberar as
permissões com `npx @guidepup/setup`) e o **NVDA** real num runner `windows-latest` do GitHub Actions.

## Cuidados que a suíte já toma

- **Contador de visitas:** o site incrementa o contador do Firestore de produção na primeira visita
  de cada navegador. Os testes marcam `gp_visited=1` antes de carregar a página, então o número
  continua aparecendo, mas não aumenta.
- **Google Analytics:** as requisições são bloqueadas, para os testes não gerarem eventos.
- **Players do YouTube:** o axe também analisa o conteúdo interno dos iframes, que não é nosso.
  Esses resultados vão para um anexo "dentro do YouTube (informativo)" e não reprovam o teste.
