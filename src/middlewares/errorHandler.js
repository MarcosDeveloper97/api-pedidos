const { AppError } = require('../errors/AppError');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(erro, req, res, next) {
  // JSON malformado enviado pelo cliente (lançado pelo express.json)
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Erros esperados de validação / não encontrado
  if (erro instanceof AppError) {
    const corpo = { erro: erro.message };
    if (erro.detalhes) corpo.detalhes = erro.detalhes;
    return res.status(erro.statusCode).json(corpo);
  }

  // Qualquer outra coisa é erro inesperado: não vaza detalhes internos
  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, errorHandler };
