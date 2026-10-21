const repository = require('../repositories/pedidos.repository');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const { TIPOS, PRIORIDADES, STATUS, STATUS_INICIAL, TRANSICOES } = require('../constants/pedido');

function ehObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function validarNovoPedido(dados) {
  if (!ehObjeto(dados)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }

  const erros = [];
  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    erros.push('cliente é obrigatório e deve ser um texto não vazio.');
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    erros.push('valor deve ser um número maior que zero.');
  }
  if (!TIPOS.includes(tipo)) {
    erros.push(`tipo inválido. Valores aceitos: ${TIPOS.join(', ')}.`);
  }
  if (!PRIORIDADES.includes(prioridade)) {
    erros.push(`prioridade inválida. Valores aceitos: ${PRIORIDADES.join(', ')}.`);
  }

  if (erros.length > 0) {
    throw new ValidationError('Dados inválidos.', erros);
  }
}

function criarPedido(dados) {
  validarNovoPedido(dados);
  return repository.criar({
    cliente: dados.cliente.trim(),
    tipo: dados.tipo,
    valor: dados.valor,
    prioridade: dados.prioridade,
    status: STATUS_INICIAL,
  });
}

function listarPedidos() {
  return repository.listar();
}

function buscarPedido(id) {
  const pedido = repository.buscarPorId(id);
  if (!pedido) {
    throw new NotFoundError(`Pedido ${id} não encontrado.`);
  }
  return pedido;
}

function atualizarStatus(id, dados) {
  const pedido = buscarPedido(id); // 404 se não existir

  if (!ehObjeto(dados) || typeof dados.status !== 'string' || !STATUS.includes(dados.status)) {
    throw new ValidationError(`status inválido. Valores aceitos: ${STATUS.join(', ')}.`);
  }

  const novoStatus = dados.status;
  const permitidos = TRANSICOES[pedido.status];

  if (!permitidos.includes(novoStatus)) {
    const opcoes = permitidos.length > 0 ? permitidos.join(', ') : 'nenhuma (status final)';
    throw new ValidationError(
      `Transição inválida: de "${pedido.status}" para "${novoStatus}". Transições permitidas: ${opcoes}.`
    );
  }

  return repository.atualizar(id, { status: novoStatus });
}

module.exports = { criarPedido, listarPedidos, buscarPedido, atualizarStatus };
