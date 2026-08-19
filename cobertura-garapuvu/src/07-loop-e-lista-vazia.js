/**
 * CASO 07 — Loop testado com uma volta só / lista vazia
 * ------------------------------------------------------
 * Um `for` é uma linha só para o relatório de cobertura. Rodar o loop
 * UMA vez já pinta tudo de verde. Mas os defeitos de loop moram em:
 *   - zero iterações (lista vazia)
 *   - uma iteração
 *   - muitas iterações
 * (é exatamente a ideia de particionamento de equivalência aplicada a coleções)
 *
 * Bugs aqui:
 *   1) lista vazia -> divisão por zero -> NaN (nenhum erro, nenhum aviso)
 *   2) `i < lista.length - 1` ignora o ÚLTIMO item; com 1 item o loop
 *      nem roda e o teste "de um item só" nunca percebe.
 *
 * Cobertura: 100%.  Defeitos escondidos: 2.
 */

function mediaDeHoras(lista) {
  let soma = 0;
  for (let i = 0; i < lista.length - 1; i++) {
    soma += lista[i];
  }
  return soma / lista.length;
}

module.exports = { mediaDeHoras };
