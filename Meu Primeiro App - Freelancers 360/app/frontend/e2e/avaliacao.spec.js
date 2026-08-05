// Teste E2E (Playwright) — foco na AVALIAÇÃO 360°.
// Dois atores (contratante + freelancer) em contextos separados. Além de percorrer o
// fluxo até "Concluído", este teste verifica o que os outros não cobrem:
//   - o botão de enviar avaliação fica DESABILITADO enquanto não há nota;
//   - a avaliação vai com COMENTÁRIO nos dois lados (360°);
//   - a REPUTAÇÃO recebida aparece no "Meu perfil" de cada um (média + nº de avaliações).
// Pré (sem webServer): backend em :3001 e frontend em :5173 rodando.
// TAGs: @interface @e2e  → rodar só E2E: playwright test --grep @e2e
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

async function cadastrar(page, { nome, papel, email, telefone, endereco }) {
  await page.goto("/");
  await page.getByTestId("landing-criar-conta").click();
  await page.getByTestId("input-nome").fill(nome);
  await page.getByTestId("input-papel").selectOption(papel);
  if (telefone) await page.getByTestId("input-telefone").fill(telefone);
  if (endereco) await page.getByTestId("input-endereco").fill(endereco);
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha-testefalhar").fill("1234");
  await page.getByTestId("enviar-auth").click();
  await expect(page.getByTestId("nav-projetos")).toBeVisible();
}

test(
  "avaliação 360: os dois lados avaliam (com comentário) e a reputação aparece no perfil",
  { tag: ["@interface", "@e2e"] },
  async ({ browser }) => {
    const sufixo = Date.now();
    const titulo = `Identidade visual ${sufixo}`;

    const ctxContratante = await browser.newContext({ baseURL: BASE });
    const ctxFreelancer = await browser.newContext({ baseURL: BASE });
    const contratante = await ctxContratante.newPage();
    const freelancer = await ctxFreelancer.newPage();

    const cardC = () => contratante.getByTestId("projeto-card").filter({ hasText: titulo });
    const cardF = () => freelancer.getByTestId("projeto-card").filter({ hasText: titulo });

    // 1) Contratante publica a vaga
    await cadastrar(contratante, { nome: "Marta Contratante", email: `contratante${sufixo}@x.com`, papel: "contratante", telefone: "(48) 90000-0000", endereco: "Florianópolis/SC" });
    await contratante.getByTestId("novo-projeto").click();
    await contratante.getByTestId("input-titulo").fill(titulo);
    await contratante.getByTestId("input-descricao").fill("Logo + manual de marca.");
    await contratante.getByTestId("salvar-projeto").click();
    await expect(cardC()).toContainText("Publicado");

    // 2) Freelancer se candidata; contratante seleciona e fecha o acordo
    await cadastrar(freelancer, { nome: "Rafa Designer", email: `freelancer${sufixo}@x.com`, papel: "freelancer" });
    await cardF().getByTestId("candidatar").click();
    await expect(cardF()).toContainText("Candidatura enviada");

    await contratante.reload();
    await cardC().getByTestId("ver-candidatos").click();
    await contratante.getByTestId("candidato").filter({ hasText: "Rafa Designer" }).getByRole("button", { name: "Selecionar" }).click();
    await expect(cardC()).toContainText("Em aprovação");
    await cardC().getByTestId("iniciar-andamento").click();
    await expect(cardC()).toContainText("Em andamento");

    // 3) Freelancer finaliza e AVALIA o contratante (nota 4 + comentário)
    await freelancer.reload();
    await cardF().getByTestId("finalizar-trabalho").click();
    // sem nota escolhida, o envio fica bloqueado
    await expect(freelancer.getByTestId("enviar-avaliacao")).toBeDisabled();
    await freelancer.getByTestId("input-comentario").fill("Contratante organizada, briefing claro.");
    await freelancer.getByTestId("estrela-4").click();
    await expect(freelancer.getByTestId("enviar-avaliacao")).toBeEnabled();
    await freelancer.getByTestId("enviar-avaliacao").click();
    await expect(cardF()).toContainText("Feedback enviado");

    // 4) Contratante conclui e AVALIA o freelancer (nota 5 + comentário)
    await contratante.reload();
    await cardC().getByTestId("concluir-projeto").click();
    await contratante.getByTestId("input-comentario").fill("Entrega impecável, recomendo!");
    await contratante.getByTestId("estrela-5").click();
    await contratante.getByTestId("enviar-avaliacao").click();
    await expect(cardC()).toContainText("Concluído");

    // 5) AVALIAÇÃO 360 refletida no perfil de cada um
    // Freelancer recebeu 5 do contratante:
    await freelancer.getByTestId("nav-perfil").click();
    await expect(freelancer.locator(".card")).toContainText("Média 5 em 1 avaliação");
    // Contratante recebeu 4 do freelancer:
    await contratante.getByTestId("nav-perfil").click();
    await expect(contratante.locator(".card")).toContainText("Média 4 em 1 avaliação");

    await ctxContratante.close();
    await ctxFreelancer.close();
  }
);
