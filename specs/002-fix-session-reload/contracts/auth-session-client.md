# Contrato do cliente para `GET /auth/session`

- `200`: normalizar e aplicar o perfil de sessão.
- `401`: tentar renovar a sessão uma vez; limpar e encaminhar ao login somente se a renovação falhar ou a nova validação retornar `401`.
- `403`: preservar a sessão e comunicar falta de permissão para o recurso.
- Erro de rede, timeout ou `5xx`: preservar a última sessão validada, expor estado de recuperação e permitir nova sincronização.
- Nunca registrar token ou cabeçalho de autorização.
