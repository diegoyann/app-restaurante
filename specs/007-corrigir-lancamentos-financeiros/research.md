# Research

## Data incorreta

- **Decision**: tratar datas financeiras como strings civis e gerar o dia padrão com componentes locais.
- **Rationale**: `toISOString()` converte o relógio local para UTC e pode avançar o calendário; `transaction_date` já é um campo sem horário.
- **Alternatives considered**: fixar offset manual é frágil; usar meio-dia ainda cria um instante desnecessário.

## Exclusão que reaparece

- **Decision**: chamar o DELETE existente antes de filtrar o estado.
- **Rationale**: o botão atual executa apenas `setTransactions(filter)`; a API e o repositório já possuem exclusão real por tenant e ID.
- **Alternatives considered**: tombstone local ou filtro por texto esconderia o dado sem corrigi-lo.

## Backend defensivo

- **Decision**: validar data civil estritamente e aceitar DELETE repetido de registro já ausente.
- **Rationale**: protege chamadas externas e cumpre integridade/retry da constituição.
- **Alternatives considered**: confiar apenas no input HTML não protege a API.
