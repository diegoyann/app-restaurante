# Análise do Template e Separação de Responsabilidades

## Diagnóstico direto

O arquivo [`template-front.jsx`](D:\Git\binho\ReiDasEsfihas\front-end\template\template-front.jsx) funciona como prova visual, não como base saudável de implementação.

Principais problemas:

- Tudo está concentrado em um único arquivo com quase 600 linhas.
- Estado de sessão, dados do dashboard, funcionários, custos, configurações e UI estão acoplados.
- Regras de cálculo financeiro estão misturadas com JSX.
- Existe manipulação direta de DOM com `document.getElementById`, o que é um mau sinal em React.
- O login é fake e depende de senha em memória local.
- Os dados iniciais estão hardcoded no componente principal.
- Não existe camada de serviços, mocks, tipagem de domínio nem persistência.

Se você começar a implementação em cima desse arquivo inteiro, vai construir dívida técnica no primeiro dia.

## O que o template realmente contém

Ele representa 6 áreas funcionais:

1. `Login`
2. `Dashboard`
3. `Financeiro`
4. `RH`
5. `Custos Fixos`
6. `Configurações`

Também existem 3 blocos transversais:

- Navegação lateral
- Cabeçalho
- Modal de categorias

## Estrutura recomendada para iniciar o front-end

```text
front-end/
  app/
    mock/
      package.json
      vite.config.js
      index.html
      src/
        main.jsx
        App.jsx
        routes/
          AppRouter.jsx
        layouts/
          AppShell.jsx
          AuthLayout.jsx
        pages/
          auth/
            LoginPage.jsx
          dashboard/
            DashboardPage.jsx
          financeiro/
            FinanceiroPage.jsx
          rh/
            RHPage.jsx
          custos/
            CustosPage.jsx
          configuracoes/
            ConfiguracoesPage.jsx
          fechamento/
            FechamentoPage.jsx
        components/
          ui/
            Logo.jsx
            StatCard.jsx
            CustomInput.jsx
            PageHeader.jsx
            EmptyState.jsx
          navigation/
            Sidebar.jsx
            NavItem.jsx
          dashboard/
            DashboardStats.jsx
            FinancialCompositionChart.jsx
            OrderCountChart.jsx
            AlertsBanner.jsx
          financeiro/
            TransactionForm.jsx
            TransactionList.jsx
            TransactionItem.jsx
          rh/
            EmployeeForm.jsx
            EmployeeList.jsx
            EmployeeItem.jsx
          custos/
            CategoryModal.jsx
            RecurringCostForm.jsx
            RecurringCostList.jsx
            RecurringCostItem.jsx
          configuracoes/
            SettingsForm.jsx
          fechamento/
            ClosingSummary.jsx
        hooks/
          useAuth.js
          useDashboardStats.js
          useRecurringCostAlerts.js
        context/
          AuthContext.jsx
          AppDataContext.jsx
        services/
          authService.js
          dashboardService.js
          employeeService.js
          recurringCostService.js
          settingsService.js
          transactionService.js
        mocks/
          auth.mock.js
          employees.mock.js
          recurringCosts.mock.js
          settings.mock.js
          transactions.mock.js
        utils/
          currency.js
          date.js
          calculations.js
          storage.js
        constants/
          appTabs.js
          platforms.js
          paymentMethods.js
        styles/
          globals.css
```

## Separação de responsabilidades

### `pages/`

Cada página deve apenas orquestrar a tela:

- buscar dados do contexto ou serviço
- disparar ações
- compor os componentes visuais

Ela não deve concentrar regra financeira pesada nem markup repetido.

### `components/ui/`

Componentes genéricos e reutilizáveis:

- `Logo`
- `CustomInput`
- `StatCard`
- `PageHeader`

Esses componentes não devem conhecer regra de negócio.

### `components/dashboard/`

Tudo que for específico do painel:

- cards
- alertas
- gráficos

### `components/financeiro/`

Tudo que pertence ao lançamento e listagem de vendas:

- formulário de transação
- item de transação
- lista de transações

### `components/rh/`

Tudo sobre equipe:

- formulário de funcionário
- item da lista
- lista

### `components/custos/`

Tudo sobre custos fixos:

- formulário
- item
- lista
- modal de categorias

### `services/`

Camada para leitura e escrita dos dados.

No mock inicial, esses serviços podem:

- ler de arquivos mock
- persistir em `localStorage`
- simular latência com `Promise`

Depois você troca essa camada pela API real sem reescrever a UI inteira.

### `hooks/`

Hooks para encapsular lógica que hoje está poluindo o `App`:

- `useDashboardStats`
- `useRecurringCostAlerts`
- `useAuth`

### `utils/`

Funções puras:

- formatação de moeda
- cálculo de líquido
- cálculo de fechamento
- datas e vencimentos

Essas funções devem sair do JSX imediatamente.

### `mocks/`

Toda massa fake separada do componente:

- funcionários
- transações
- custos
- configurações
- autenticação fake

## Mapeamento do arquivo atual para a nova estrutura

### Blocos que já podem virar arquivo sem discussão

- `Logo` -> `src/components/ui/Logo.jsx`
- `StatCard` -> `src/components/ui/StatCard.jsx`
- `CustomInput` -> `src/components/ui/CustomInput.jsx`
- `CategoryModal` -> `src/components/custos/CategoryModal.jsx`

### Lógica que deve sair do `App`

- `activeAlerts` -> `src/hooks/useRecurringCostAlerts.js`
- `stats` -> `src/hooks/useDashboardStats.js` ou `src/utils/calculations.js`
- `handleLogin` -> `src/services/authService.js` + `src/hooks/useAuth.js`
- `handleAddTransaction` -> `src/services/transactionService.js`
- `handleAddEmployee` -> `src/services/employeeService.js`
- `handleAddRecurringCost` -> `src/services/recurringCostService.js`
- `handleUpdateSettings` -> `src/services/settingsService.js`

### Telas que precisam nascer como páginas

- aba `dashboard` -> `src/pages/dashboard/DashboardPage.jsx`
- aba `financeiro` -> `src/pages/financeiro/FinanceiroPage.jsx`
- aba `rh` -> `src/pages/rh/RHPage.jsx`
- aba `costs` -> `src/pages/custos/CustosPage.jsx`
- aba `closing` -> `src/pages/fechamento/FechamentoPage.jsx`
- aba `settings` -> `src/pages/configuracoes/ConfiguracoesPage.jsx`

## Ordem certa para implementar

1. Criar a base do projeto React com Vite.
2. Instalar Tailwind, React Router, Lucide e Recharts.
3. Subir a casca da aplicação com `AppShell`, `Sidebar` e `PageHeader`.
4. Criar as páginas vazias.
5. Extrair os componentes UI básicos.
6. Mover os mocks para arquivos separados.
7. Criar os serviços fake com `localStorage`.
8. Extrair hooks de cálculo e alertas.
9. Só depois preencher cada página com os componentes específicos.

## Bibliotecas mínimas para o mock inicial

- `react`
- `react-dom`
- `react-router-dom`
- `lucide-react`
- `recharts`
- `tailwindcss`
- `@tailwindcss/vite`

## Observação importante

Se a sua ideia era “pegar esse JSX e jogar inteiro dentro de um projeto React”, descarte isso agora. Isso acelera só nas primeiras duas horas. Depois vira um lamaçal.
