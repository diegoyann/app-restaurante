# Quickstart: Restaurar Lançamento de Saídas

## Evidência anterior à correção

- Em 2026-08-20, no frontend oficial e tenant autenticado `bady-bassitt`, a tela `#financeiro` carregou normalmente.
- Ao abrir “Lançar saída avulsa”, os campos Tipo, Pagamento, Categoria econômica, Origem e Data estavam disponíveis.
- O seletor obrigatório Categoria abriu com **0 opções**, impedindo a formação de um payload válido e reproduzindo o relato sem criar ou alterar lançamento.
- Console do navegador sem warnings ou errors durante a reprodução; o defeito observado é o contrato vazio de `financeExpenseCategories`.
- Limite: corrigir somente a projeção de categorias vazias; não alterar schema, lançamentos, saldos, competências ou cadastros próprios.
- Rollback: reverter o commit e republicar o backend; não há compensação de dados.

## Regressão local

1. Executar primeiro o novo teste isolado antes da correção e confirmar falha para lista vazia.
2. Após a correção, executar em `back-end`:

   ```powershell
   node --test src/modules/app/projections/financeProjection.test.js
   npm test
   ```

3. Confirmar:
   - lista vazia produz exatamente sete categorias padrão;
   - categorias próprias são preservadas sem mistura;
   - chamadas repetidas não compartilham mutação.

### Evidência TDD

- Resultado anterior à implementação: `node --test src/modules/app/projections/financeProjection.test.js` falhou como esperado porque `financeProjection.js` não exportava nem aplicava `resolveFinanceExpenseCategories`; 0 testes passaram e o processo encerrou com 1 falha de módulo.
- Resultado após implementação: teste isolado aprovado com 3 testes, 0 falhas, cobrindo fallback, preservação e isolamento entre requests.

## Gates locais executados em 2026-08-20

- `node --test src/modules/app/projections/financeProjection.test.js`: PASS, 3 testes, 0 falhas.
- `npm test` em `back-end`: PASS, 58 testes, 0 falhas.
- `git diff --check`: PASS, sem erro de whitespace.
- Revisão de escopo: somente projeção financeira, novo teste de regressão e artefatos `specs/011-fix-saidas/`; nenhuma migration, alteração de schema, frontend ou endpoint de escrita.
- FR-001–FR-010 cobertos localmente; FR-011 e SC-003/SC-005 dependem de deploy e T008.

## Publicação

1. Validar diff, commit e push da branch `codex/011-fix-saidas`.
2. Em `back-end`, executar `vercel --prod --yes` e confirmar o alias oficial.

### Resultado da publicação em 2026-08-20

- Deployment backend: `https://rei-das-esfihas-backend-jcyjlk6ie-diegoyanns-projects.vercel.app`.
- Alias oficial: `https://rei-das-esfihas-backend.vercel.app`.
- Estado informado pela Vercel: `READY`, target `production`.

## Aceitação no navegador publicado

1. Abrir `https://rei-das-esfihas-frontend.vercel.app/app/bady-bassitt#financeiro` com sessão autorizada.
2. Abrir “Lançar saída avulsa”.
3. Confirmar sete opções visíveis no seletor Categoria.
4. Preencher uma saída QA de baixo valor e solicitar confirmação do usuário imediatamente antes de lançar.
5. Confirmar mensagem de sucesso, presença na competência e persistência após reload.
6. Verificar console e rede sem erro de CORS, servidor ou contrato.
7. Solicitar confirmação imediatamente antes de excluir o lançamento QA e confirmar sua ausência após reload.

### Evidência da aceitação publicada em 2026-08-20

- URL navegada: `https://rei-das-esfihas-frontend.vercel.app/app/bady-bassitt#financeiro`.
- O formulário “Lançar saída avulsa” apresentou exatamente 7 categorias: Compra de Insumos, Fornecedor, Manutenção, Marketing, Imposto, Retirada e Outras Saídas.
- Com confirmação do usuário, foi criada uma saída QA de R$ 0,01, PIX/banco, categoria Outras Saídas e observação `QA CODEX saída fallback 2026-08-20`.
- A interface exibiu sucesso, o registro apareceu na competência 2026-08 e permaneceu após reload.
- Console do navegador: 0 warnings e 0 errors durante criação e reload; nenhum erro de CORS, rede, contrato ou servidor foi observado.
- Com confirmação do usuário, somente o registro QA foi excluído; a interface exibiu “Lançamento excluído definitivamente.”
- Um novo reload retornou 0 ocorrências da observação QA e manteve o console sem erros.

## Rollback

Reverter o commit e republicar somente o backend. Não há migration nem compensação de dados.
