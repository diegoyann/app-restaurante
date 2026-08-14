# Contrato do cliente para `GET /auth/session`

- `200`: normalizar e aplicar o perfil de sessão.
- `401` ou `403`: limpar a sessão e encaminhar ao login.
- Erro de rede, timeout ou `5xx`: preservar a última sessão validada, expor estado de recuperação e permitir nova sincronização.
- Nunca registrar token ou cabeçalho de autorização.
