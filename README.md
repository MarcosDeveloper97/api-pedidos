# API de Gerenciamento de Pedidos

Projeto prático avaliativo — Tópicos Avançados em Sistemas de Informação II.

API REST em **Node.js + Express** (JavaScript) para gerenciar pedidos de uma pequena loja, com arquitetura em camadas, validação de dados, tratamento de erros e testes automatizados com Jest. Os dados ficam **em memória** (reiniciar o servidor apaga os pedidos).

- **Aluno:** Marcos Vinicius de Oliveira Corrêa
- **RA:** 144002530

## Instalação e execução

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm start        # sobe em http://localhost:3000 (porta alterável com a variável PORT)
npm test         # executa os testes com Jest
```

## Rotas

| Método | Rota | Sucesso | Erros |
|--------|------|---------|-------|
| POST | `/pedidos` | 201 + pedido criado | 400 dados inválidos |
| GET | `/pedidos` | 200 + lista | — |
| GET | `/pedidos/:id` | 200 + pedido | 404 inexistente |
| PATCH | `/pedidos/:id/status` | 200 + pedido atualizado | 400 status/transição inválidos; 404 inexistente |

Rotas não existentes respondem 404 em JSON. Erros inesperados respondem 500 com mensagem genérica (sem expor detalhes internos).

### Exemplos

**Criar pedido**

```http
POST /pedidos
Content-Type: application/json

{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```

Resposta `201`:

```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

**Dados inválidos** (`400`):

```json
{
  "erro": "Dados inválidos.",
  "detalhes": [
    "cliente é obrigatório e deve ser um texto não vazio.",
    "valor deve ser um número maior que zero."
  ]
}
```

**Pedido inexistente** (`404`):

```json
{ "erro": "Pedido 999 não encontrado." }
```

**Atualizar status**

```http
PATCH /pedidos/1/status
Content-Type: application/json

{ "status": "em_preparacao" }
```

**Transição inválida** (`400`):

```json
{ "erro": "Transição inválida: de \"recebido\" para \"entregue\". Transições permitidas: em_preparacao, cancelado." }
```

## Regras de validação

| Campo | Regra |
|-------|-------|
| `cliente` | Obrigatório; texto não vazio após remover espaços das extremidades (o valor é salvo já sem esses espaços). |
| `valor` | Obrigatório; do tipo **número** JSON (texto como `"350"` é rejeitado) e **maior que zero**. |
| `tipo` | `entrega`, `retirada` ou `balcao`. |
| `prioridade` | `baixa`, `normal` ou `alta`. |
| `status` (PATCH) | Um dos status abaixo, respeitando as transições permitidas. |

Outros comportamentos:

- Corpo ausente, JSON malformado ou que não seja um objeto → `400`.
- ID que não existe **ou** que não é numérico (ex.: `/pedidos/abc`) → `404`.
- No PATCH, a existência do ID é verificada **antes** da validação do corpo (ID inexistente → 404 mesmo com corpo inválido).

## Status e transições

O pedido nasce com status `recebido`. As transições permitidas são:

| Status atual | Pode ir para |
|--------------|--------------|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | — (final) |
| `cancelado` | — (final) |

Regra de negócio: o pedido só pode ser cancelado **antes** de ser enviado. Repetir o status atual também é uma transição inválida (400).

## Arquitetura

Arquitetura em camadas, onde cada camada só conhece a camada imediatamente abaixo:

```
Requisição HTTP
   │
   ▼
routes/        define as rotas e liga cada uma a um controller
   │
   ▼
controllers/   traduz HTTP <-> service (lê req, devolve status code); não tem regra de negócio
   │
   ▼
services/      regras de negócio: validações, máquina de estados, erros esperados
   │
   ▼
repositories/  acesso aos dados (array em memória); não tem regra de negócio
```

```
src/
├── app.js                      # monta o Express (JSON, rotas, tratamento de erros)
├── server.js                   # inicia o servidor (separado do app para facilitar testes)
├── routes/pedidos.routes.js
├── controllers/pedidos.controller.js
├── services/pedidos.service.js
├── repositories/pedidos.repository.js
├── constants/pedido.js         # tipos, prioridades, status e tabela de transições
├── errors/AppError.js          # AppError, ValidationError (400), NotFoundError (404)
└── middlewares/errorHandler.js # converte erros em respostas HTTP; qualquer erro desconhecido vira 500
tests/
├── pedidos.service.test.js     # testes unitários das regras de negócio
└── pedidos.api.test.js         # testes de integração HTTP (Supertest)
```

**Padrão implementado:** Layered Architecture (Routes → Controller → Service → Repository), com tratamento de erros centralizado em middleware. Os services lançam erros tipados (`ValidationError`, `NotFoundError`); o middleware `errorHandler` os converte em 400/404, e qualquer outro erro vira 500.

## Testes

```bash
npm test
```

- **Unitários (service):** criação válida, cada validação inválida, fluxo completo de status, cancelamento permitido/proibido, status finais, ID inexistente.
- **Integração (API):** códigos HTTP e corpo de cada endpoint, JSON malformado, corpo ausente, ID não numérico e rota desconhecida.

Testes manuais com Postman: importe `docs/postman_collection.json`. As capturas ficam em `evidencias/`.

## Evidências

Pasta `evidencias/` com as capturas do Postman:

`01-criacao.png`, `02-validacao.png`, `03-listagem.png`, `04-consulta-inexistente.png`, `05-atualizacao.png`

## Uso de IA

- **Utilizei IA?** Sim, o assistente Claude (Anthropic).
- **Para quais tarefas?** Geração da estrutura inicial do projeto, dos testes automatizados e do rascunho deste README.
- **Sugestão aceita:** separar `app.js` e `server.js`, para que os testes importem o app sem abrir uma porta de rede. Aceitei porque o Supertest depende disso.
- **Sugestão modificada:** a IA gerou apenas os tipos de pedido `entrega` e `retirada`. Adicionei `balcao` em `src/constants/pedido.js`, porque uma loja pequena também vende no balcão, e atualizei o README e os testes.
- **Sugestão rejeitada:** não rejeitei nenhuma sugestão relevante. Revisei as decisões da IA (como retornar 400 em transição de status inválida) e mantive porque consegui justificá-las pelo enunciado.
- **O que eu verifiquei por conta própria:** executei a API com `npm start` e testei manualmente no Postman os cinco cenários exigidos (criação válida, validação com 400, listagem, consulta inexistente com 404 e atualização de status), registrados em `evidencias/`. Executei `npm test` e todos os testes passaram. Li o código de cada camada (routes, controllers, services e repository).