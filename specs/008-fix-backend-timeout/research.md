# Research: Timeout do backend

## Evidência

- **Decision**: Tratar o timeout de runtime como causa raiz.
- **Rationale**: Os logs de produção registraram seis respostas 504 em
  `/api/app/bootstrap`, todas com `Task timed out after 10 seconds`. A navegação
  pública e o CORS passaram, descartando a hipótese inicial.
- **Alternatives considered**: Alteração de CORS foi descartada; reestruturação
  do bootstrap foi adiada porque ele já paraleliza as projeções e não há evidência
  de uma consulta específica defeituosa.

## Correção

- **Decision**: Configurar `maxDuration` em 60 segundos.
- **Rationale**: Remove o teto artificial de 10 segundos durante inicializações
  frias sem mudar contratos ou dados.
- **Alternatives considered**: Retry automático foi rejeitado nesta correção
  porque repetiria a consulta pesada e poderia dobrar carga e latência.
