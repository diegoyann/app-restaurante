# Plan: Logs persistentes de erros

Criar migração forward-only com RLS sem políticas de cliente, centralizar a persistência no `sendError`, sanitizar dados e validar com teste backend. Sem alteração de contrato público.
