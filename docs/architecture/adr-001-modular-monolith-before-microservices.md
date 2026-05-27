# ADR-001: Modularizar antes de extrair microservicos

## Status

Aceito

## Contexto

O back-end tem varias rotas por dominio, mas as regras e consultas estao concentradas em `back-end/src/repositories/appRepository.js`. Isso cria acoplamento forte entre pedidos, financeiro, cardapio, catalogo, clientes, RH, delivery e administracao.

O pedido foi separar a aplicacao em microservicos. A separacao direta agora teria alto risco porque ainda nao existem fronteiras internas fortes.

## Decisao

Adotar primeiro um monolito modular com `back-end/src/modules/*` como fronteira de dominio. Os handlers HTTP devem importar esses modulos, nao o repositório global.

Microservicos reais serao extraidos depois, por ordem de risco e valor operacional:

1. integracoes;
2. pedidos;
3. financeiro;
4. delivery.

## Racional

- A aplicacao ainda compartilha banco, bootstrap e repositório central.
- Extrair processos agora duplicaria acoplamento e aumentaria custo operacional.
- Modulos de dominio criam um ponto de corte seguro para mover codigo e contratos gradualmente.
- A operacao de restaurante precisa de estabilidade no pedido e caixa antes de arquitetura bonita.

## Trade-offs

- Ainda nao existe isolamento fisico entre servicos.
- O `appRepository.js` continua existindo como legado temporario.
- A extracao real exigira uma segunda etapa de eventos, migrations por dominio e testes de contrato.

## Consequencias

- Positivo: handlers passam a respeitar fronteiras de dominio.
- Positivo: fica claro qual parte pode virar servico primeiro.
- Negativo: ainda ha acoplamento interno escondido no repositório legado.
- Mitigacao: mover funcoes de `appRepository.js` para repositories/services dentro de cada modulo, um dominio por vez.

## Gatilho de revisao

Revisar quando:

- `orders`, `finance` e `integrations` tiverem repositories proprios;
- houver eventos internos para pedido criado/entregue/importado;
- o volume ou risco operacional justificar deploy independente.
