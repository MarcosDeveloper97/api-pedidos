const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidos.repository');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => repository.reset());

describe('POST /pedidos', () => {
  test('201 com pedido criado', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('400 com mensagem JSON quando os dados são inválidos', async () => {
    const res = await request(app).post('/pedidos').send({ cliente: '   ', valor: -5 });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
    expect(res.body.detalhes.length).toBeGreaterThan(0);
  });

  test('400 quando o JSON é malformado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente": ');
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/JSON/);
  });

  test('400 quando não há corpo', async () => {
    const res = await request(app).post('/pedidos');
    expect(res.status).toBe(400);
  });
});

describe('GET /pedidos', () => {
  test('200 com lista vazia e depois com itens', async () => {
    expect((await request(app).get('/pedidos')).body).toEqual([]);
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /pedidos/:id', () => {
  test('200 para pedido existente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
    expect(res.body.cliente).toBe('Carlos Silva');
  });

  test('404 para id inexistente ou não numérico', async () => {
    expect((await request(app).get('/pedidos/999')).status).toBe(404);
    expect((await request(app).get('/pedidos/abc')).status).toBe(404);
  });
});

describe('PATCH /pedidos/:id/status', () => {
  test('200 com atualização válida', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('400 para status inválido e para transição não permitida', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    expect((await request(app).patch('/pedidos/1/status').send({ status: 'xyz' })).status).toBe(400);
    expect((await request(app).patch('/pedidos/1/status').send({ status: 'entregue' })).status).toBe(400);
  });

  test('404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });
    expect(res.status).toBe(404);
  });
});

describe('rotas desconhecidas', () => {
  test('404 em JSON', async () => {
    const res = await request(app).get('/nada');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });
});
