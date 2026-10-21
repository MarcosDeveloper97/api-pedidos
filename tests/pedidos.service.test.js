const service = require('../src/services/pedidos.service');
const repository = require('../src/repositories/pedidos.repository');
const { ValidationError, NotFoundError } = require('../src/errors/AppError');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => repository.reset());

describe('criarPedido', () => {
  test('cria pedido válido com id sequencial e status inicial "recebido"', () => {
    const p1 = service.criarPedido(pedidoValido);
    const p2 = service.criarPedido(pedidoValido);
    expect(p1).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
    expect(p2.id).toBe(2);
  });

    test('aceita o tipo "balcao"', () => {
    const p = service.criarPedido({ ...pedidoValido, tipo: 'balcao' });
    expect(p.tipo).toBe('balcao');
  });

  test('remove espaços nas extremidades do cliente', () => {
    const p = service.criarPedido({ ...pedidoValido, cliente: '  Ana  ' });
    expect(p.cliente).toBe('Ana');
  });

  test.each([
    ['cliente ausente', { cliente: undefined }],
    ['cliente vazio', { cliente: '' }],
    ['cliente só com espaços', { cliente: '    ' }],
    ['cliente não textual', { cliente: 123 }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -10 }],
    ['valor em texto', { valor: '350' }],
    ['valor NaN', { valor: NaN }],
    ['valor ausente', { valor: undefined }],
    ['tipo desconhecido', { tipo: 'teletransporte' }],
    ['prioridade desconhecida', { prioridade: 'urgentissima' }],
  ])('rejeita %s', (_, alteracao) => {
    expect(() => service.criarPedido({ ...pedidoValido, ...alteracao })).toThrow(ValidationError);
  });

  test.each([[null], [undefined], ['texto'], [[]]])('rejeita corpo %p', (corpo) => {
    expect(() => service.criarPedido(corpo)).toThrow(ValidationError);
  });

  test('acumula todas as mensagens de erro', () => {
    try {
      service.criarPedido({});
      throw new Error('deveria ter lançado');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.detalhes).toHaveLength(4);
    }
  });
});

describe('listar e buscar', () => {
  test('lista vazia no início', () => {
    expect(service.listarPedidos()).toEqual([]);
  });

  test('busca pedido existente', () => {
    const criado = service.criarPedido(pedidoValido);
    expect(service.buscarPedido(criado.id)).toEqual(criado);
  });

  test('lança NotFoundError para id inexistente', () => {
    expect(() => service.buscarPedido(99)).toThrow(NotFoundError);
    expect(() => service.buscarPedido(NaN)).toThrow(NotFoundError);
  });
});

describe('atualizarStatus', () => {
  test('segue o fluxo completo recebido -> entregue', () => {
    const { id } = service.criarPedido(pedidoValido);
    expect(service.atualizarStatus(id, { status: 'em_preparacao' }).status).toBe('em_preparacao');
    expect(service.atualizarStatus(id, { status: 'enviado' }).status).toBe('enviado');
    expect(service.atualizarStatus(id, { status: 'entregue' }).status).toBe('entregue');
  });

  test('permite cancelar antes do envio', () => {
    const { id } = service.criarPedido(pedidoValido);
    expect(service.atualizarStatus(id, { status: 'cancelado' }).status).toBe('cancelado');
  });

  test.each([
    ['recebido', 'enviado'],
    ['recebido', 'entregue'],
    ['recebido', 'recebido'],
  ])('rejeita transição %s -> %s', (_de, para) => {
    const { id } = service.criarPedido(pedidoValido);
    expect(() => service.atualizarStatus(id, { status: para })).toThrow(ValidationError);
  });

  test('não permite cancelar pedido já enviado', () => {
    const { id } = service.criarPedido(pedidoValido);
    service.atualizarStatus(id, { status: 'em_preparacao' });
    service.atualizarStatus(id, { status: 'enviado' });
    expect(() => service.atualizarStatus(id, { status: 'cancelado' })).toThrow(ValidationError);
  });

  test('status finais não aceitam novas transições', () => {
    const { id } = service.criarPedido(pedidoValido);
    service.atualizarStatus(id, { status: 'cancelado' });
    expect(() => service.atualizarStatus(id, { status: 'recebido' })).toThrow(ValidationError);
  });

  test('rejeita status desconhecido, ausente ou corpo inválido', () => {
    const { id } = service.criarPedido(pedidoValido);
    expect(() => service.atualizarStatus(id, { status: 'voando' })).toThrow(ValidationError);
    expect(() => service.atualizarStatus(id, {})).toThrow(ValidationError);
    expect(() => service.atualizarStatus(id, undefined)).toThrow(ValidationError);
  });

  test('id inexistente gera NotFoundError', () => {
    expect(() => service.atualizarStatus(42, { status: 'cancelado' })).toThrow(NotFoundError);
  });
});
