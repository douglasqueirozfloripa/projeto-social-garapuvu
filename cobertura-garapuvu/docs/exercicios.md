# Aula 09 — Roteiro de sala e exercícios

**Projeto Social Garapuvu 2026 · Módulo 1 · Aula 09**

---

## Roteiro sugerido (60–75 min)

| Tempo | O que fazer |
|-------|-------------|
| 0–5 | Pergunta de abertura: *"quem aqui já viu um projeto com cobertura alta e bug em produção?"* |
| 5–15 | Rodar `npm run cobertura` na tela. Mostrar os quatro 100% e dizer que o código está quebrado |
| 15–20 | Abrir `src/01-tipos-inesperados.js` e pedir para a turma listar entradas que ninguém testou |
| 20–35 | Rodar `npm run realidade`. Percorrer os 🐛 caso a caso, projetando o código ao lado |
| 35–45 | Rodar `npm run mutacao`. Discutir os 20 mutantes sobreviventes — em especial o caso 04 (25%) |
| 45–55 | Caso 09: o requisito que nunca virou código. Ligar com rastreabilidade e teste estático |
| 55–70 | Exercícios em dupla (abaixo) |
| 70–75 | Fechamento: os "leve daqui" e a discussão sobre KPI |

---

## Exercício 1 — Quebre a função (10 min)

Abra `src/01-tipos-inesperados.js`. Sem olhar a suíte "realidade", escreva no papel **cinco entradas** que fazem `calcularInscricao` devolver algo errado sem lançar erro.

Depois rode:

```bash
node -e "const {calcularInscricao}=require('./src/01-tipos-inesperados');console.log(calcularInscricao('200',0))"
```

**Pergunta:** o teste que dá 100% de cobertura precisaria mudar para pegar isso? Ou é o *código* que precisa mudar? (Resposta: os dois — teste que exercita a entrada inválida **e** guarda de contrato no código.)

---

## Exercício 2 — Ache a fronteira (10 min)

`src/03-valor-limite.js` classifica severidade por minutos fora do ar.

1. Sem rodar nada, escreva a tabela de valores limite que você testaria.
2. Compare com o que a suíte "ilusão" testou (300, 120, 10, 0).
3. Rode `npm run realidade -- -t "fronteira"` e veja o que aparece.

**Meta:** sair da aula testando `n-1`, `n` e `n+1` em toda faixa numérica, por reflexo.

---

## Exercício 3 — Escreva o teste que mata o mutante (15 min)

Rode `npm run mutacao` e abra o relatório em `reports/mutacao-ilusao/index.html`.

Escolha **um mutante sobrevivente** do arquivo `04-assercao-fraca.js` e escreva, em `tests/ilusao/ilusao.test.js`, um teste que o mate.

Depois rode a mutação de novo e confira se o score subiu.

> Dica: quase sempre a resposta é trocar `toBeDefined()` por uma asserção que compara o **valor exato esperado**.

---

## Exercício 4 — O requisito invisível (10 min)

Leia `src/09-requisito-ausente.js`.

1. Qual é o requisito que não virou código?
2. Que **tipo de teste** encontraria isso? (Dica: não é teste de caixa-branca.)
3. Escreva o caso de teste em linguagem natural, no formato do CTFL: pré-condição, passos, resultado esperado.
4. Agora implemente a validação e o teste. Compare com `src/corrigido/09-requisito-ausente.js`.

---

## Exercício 5 — Cobertura como KPI (discussão, 10 min)

O time propõe: *"vamos travar o merge de qualquer PR com menos de 90% de cobertura"*.

Divida a turma em dois grupos:

- **Grupo A** defende a regra.
- **Grupo B** argumenta contra.

Depois, juntos, escrevam **uma regra melhor** — que use cobertura sem transformá-la em meta cega. Sugestões que costumam aparecer:

- cobertura **do diff** (linhas novas do PR), não do projeto inteiro
- cobertura como **alerta** no relatório, não como bloqueio
- travar por **score de mutação** nos módulos críticos
- exigir rastreabilidade requisito → caso de teste na definição de pronto

---

## Exercício 6 — Do sobrevivente ao ajuste no código (15 min)

Rode `npm run mutacao:corrigido` e abra `reports/mutacao-corrigido/index.html`.

Sobram **3 mutantes**, todos no `04-assercao-fraca.js`. Para cada um:

1. Leia o diff e responda: essa alteração muda o resultado para **alguma** entrada possível?
2. Se muda → escreva o teste que mata.
3. Se não muda → é **mutante equivalente**. Registre e siga em frente.

Depois discuta: por que os 7 sobreviventes da rodada anterior viraram **ajustes no código** (remover `typeof` redundante, remover `if` inútil, adicionar `.filter(Boolean)`) e não testes novos?

> Resposta curta: mutante sobrevivente nem sempre significa "falta teste". Muitas vezes significa "sobra código".

---

## Exercício 7 — Ache o bug que a cobertura de 100% não achou (10 min)

O `08-numeros-e-igualdade.js` corrigido foi corrigido **duas vezes**. A primeira versão usava:

```js
return acc + Math.round(d * 100);
```

Rode no terminal:

```bash
node -e "console.log(1.005 * 100, Math.round(1.005 * 100))"
```

1. Por que o resultado não é 100.5?
2. Que valor `fecharCaixa([1.005, 1.005])` devolvia antes da segunda correção?
3. A primeira versão tinha 100% de cobertura. Que **tipo** de teste encontrou esse defeito?
4. Olhe `paraCentavos()` em `src/corrigido/08-numeros-e-igualdade.js`. Por que o `toFixed(6)` resolve?
5. Pergunta de negócio: arredondar **por item** ou **só no total**? Qual das duas o código faz hoje? Onde isso está documentado?

---

## Desafio de casa

Pegue um dos apps reais do curso — `bug-report-garapuvu/` ou o app da Copa 2026 — e:

1. Rode a suíte com `--coverage`.
2. Abra o relatório HTML e liste **as três linhas vermelhas mais perigosas**.
3. Escreva um teste para cada uma.
4. Rode teste de mutação em **um** arquivo e conte quantos mutantes sobreviveram.
5. Traga o número para a próxima aula.

---

## Gabarito rápido dos casos

| Caso | Defeito no código | Defeito no teste |
|------|-------------------|------------------|
| 01 | Sem guarda de tipo/faixa | Só testou números válidos |
| 02 | `\|\|` no lugar de `&&` | Não isolou cada condição |
| 03 | `>` no lugar de `>=` | Testou o meio da faixa, não a fronteira |
| 04 | Mês e dia trocados | `toBeDefined()` no lugar da string exata |
| 05 | `sort()` sem comparador + mutação + estado de módulo | Não olhou o array original nem chamou duas vezes |
| 06 | Erro engolido (retorna `undefined`) | Promise sem `await` |
| 07 | Off-by-one + divisão por zero | Só testou uma lista de 2 itens, com valor esperado copiado do código |
| 08 | Float, `!=` e `===` com NaN | Só testou inteiros redondos |
| 09 | Requisito não implementado | Nenhum teste rastreado ao requisito |

---

*Projeto Social Garapuvu 2026 · Módulo 1 · Aula 09*
