/**
 * Testes de API — rotas REST /api/bugs (Supertest)
 *
 * O Supertest importa o app Express diretamente, sem abrir porta:
 * cada requisição é simulada de verdade, passando por rotas,
 * middlewares e validação — exatamente como em produção.
 */

const request = require('supertest');
const { criarApp } = require('../../backend/app.js');

function corpoValido(extras = {}) {
  return {
    titulo: 'CTA do WhatsApp abre link errado',
    passos: '1. Rolar até o rodapé. 2. Clicar no botão do WhatsApp.',
    esperado: 'Abrir conversa do wa.me do projeto',
    obtido: 'Abre página 404',
    severidade: 'alta',
    prioridade: 'alta',
    ambiente: 'macOS · Chrome 126',
    ...extras
  };
}

describe('API /api/bugs', () => {
  let app;

  beforeEach(() => {
    app = criarApp(); // app novinho por teste = testes independentes
  });

  describe('GET /api/saude', () => {
    test('healthcheck responde 200 com ok=true', async () => {
      const res = await request(app).get('/api/saude');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.servico).toBe('bug-report-garapuvu');
    });
  });

  describe('POST /api/bugs', () => {
    test('cria bug válido e responde 201 com o recurso criado', async () => {
      const res = await request(app).post('/api/bugs').send(corpoValido());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: 1,
        titulo: 'CTA do WhatsApp abre link errado',
        status: 'aberto'
      });
      expect(res.body.criadoEm).toEqual(expect.any(String));
    });

    test('recusa bug inválido com 400 e lista de erros', async () => {
      const res = await request(app).post('/api/bugs').send({ titulo: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('Bug inválido.');
      expect(Array.isArray(res.body.detalhes)).toBe(true);
      expect(res.body.detalhes.length).toBeGreaterThan(0);
    });

    test('recusa severidade inexistente com 400', async () => {
      const res = await request(app)
        .post('/api/bugs')
        .send(corpoValido({ severidade: 'monstruosa' }));
      expect(res.status).toBe(400);
      expect(res.body.detalhes.join(' ')).toMatch(/severidade/i);
    });
  });

  describe('GET /api/bugs', () => {
    test('lista vazia no início', async () => {
      const res = await request(app).get('/api/bugs');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('lista os bugs criados', async () => {
      await request(app).post('/api/bugs').send(corpoValido());
      await request(app).post('/api/bugs').send(corpoValido({ titulo: 'Segundo bug da lista' }));

      const res = await request(app).get('/api/bugs');
      expect(res.body).toHaveLength(2);
    });

    test('filtra por status e severidade via query string', async () => {
      await request(app).post('/api/bugs').send(corpoValido({ severidade: 'baixa' }));
      await request(app).post('/api/bugs').send(corpoValido({ severidade: 'critica' }));

      const criticos = await request(app).get('/api/bugs?severidade=critica');
      expect(criticos.body).toHaveLength(1);
      expect(criticos.body[0].severidade).toBe('critica');

      const abertos = await request(app).get('/api/bugs?status=aberto');
      expect(abertos.body).toHaveLength(2);
    });
  });

  describe('GET /api/bugs/:id', () => {
    test('devolve o bug pelo id', async () => {
      const criado = await request(app).post('/api/bugs').send(corpoValido());
      const res = await request(app).get(`/api/bugs/${criado.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(criado.body.id);
    });

    test('404 para bug inexistente', async () => {
      const res = await request(app).get('/api/bugs/999');
      expect(res.status).toBe(404);
      expect(res.body.erro).toMatch(/não encontrado/i);
    });
  });

  describe('PUT /api/bugs/:id', () => {
    test('atualiza o status do bug', async () => {
      const criado = await request(app).post('/api/bugs').send(corpoValido());
      const res = await request(app)
        .put(`/api/bugs/${criado.body.id}`)
        .send({ status: 'corrigido' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('corrigido');
    });

    test('404 ao atualizar bug inexistente', async () => {
      const res = await request(app).put('/api/bugs/999').send({ status: 'fechado' });
      expect(res.status).toBe(404);
    });

    test('400 ao atualizar com dados inválidos', async () => {
      const criado = await request(app).post('/api/bugs').send(corpoValido());
      const res = await request(app)
        .put(`/api/bugs/${criado.body.id}`)
        .send({ status: 'desapareceu' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/bugs/:id', () => {
    test('remove o bug e responde 204 sem corpo', async () => {
      const criado = await request(app).post('/api/bugs').send(corpoValido());
      const res = await request(app).delete(`/api/bugs/${criado.body.id}`);
      expect(res.status).toBe(204);

      const busca = await request(app).get(`/api/bugs/${criado.body.id}`);
      expect(busca.status).toBe(404);
    });

    test('404 ao remover bug inexistente', async () => {
      const res = await request(app).delete('/api/bugs/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/bugs/resetar', () => {
    test('limpa todos os bugs (apoio aos testes E2E)', async () => {
      await request(app).post('/api/bugs').send(corpoValido());
      const reset = await request(app).post('/api/bugs/resetar');
      expect(reset.status).toBe(200);

      const res = await request(app).get('/api/bugs');
      expect(res.body).toEqual([]);
    });
  });
});
