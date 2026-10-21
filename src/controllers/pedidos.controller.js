const service = require('../services/pedidos.service');

function lerId(valor) {
  return /^\d+$/.test(valor) ? Number(valor) : NaN;
}


function criar(req, res, next) {
  try {
    const pedido = service.criarPedido(req.body);
    res.status(201).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(service.listarPedidos());
  } catch (erro) {
    next(erro);
  }
}

function consultar(req, res, next) {
  try {
     const id = lerId(req.params.id);
    res.status(200).json(service.buscarPedido(id));
  } catch (erro) {
    next(erro);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const id = lerId(req.params.id);
    res.status(200).json(service.atualizarStatus(id, req.body));
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listar, consultar, atualizarStatus };
