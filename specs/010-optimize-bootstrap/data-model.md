# Data Model: Telemetria do bootstrap

Não há nova entidade de negócio nem persistência obrigatória. O desenho adiciona eventos operacionais efêmeros.

## BootstrapTrace

- `requestId`: identificador opaco, sem token ou dado pessoal.
- `tenant`: slug de roteamento, sem conteúdo do tenant.
- `coldStart`: primeira execução observável da instância.
- `startedAt`, `durationMs`, `status`, `payloadBytes`.
- `phases`: coleção de `BootstrapSpan`.
- `queryCount`: operações remotas observadas.
- `errorCode`: código sanitizado, nunca stack/token/payload no evento de desempenho.

## BootstrapSpan

- `name`: fase estável (`authentication`, `tenant`, `permissions`, `projection.finance`, `serialization`, etc.).
- `durationMs`, `queryCount`, `rowCount`, `payloadBytes`.
- `outcome`: `ok` ou `error`.

## Validações

- Todos os spans compartilham `requestId` e tenant.
- Durações/contagens são não negativas; bytes usam UTF-8.
- Não registrar corpo, token, e-mail, ID de usuário ou conteúdo financeiro/RH.
- Migration eventual não altera linhas; definição e compensação serão registradas.
