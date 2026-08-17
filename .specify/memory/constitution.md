<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: II. Test the Rule Before Changing It;
                       V. Reproducible Quality Gates
- Added sections: none
- Removed sections: none
- Templates reviewed: ✅ .specify/templates/spec-template.md (compatible)
                      ⚠ .specify/templates/plan-template.md (must add the
                        deployed browser-navigation gate)
                      ⚠ .specify/templates/tasks-template.md (must add a
                        mandatory post-deployment browser task)
- Follow-up TODOs: synchronize plan-template.md and tasks-template.md in a
  separate Spec Kit template-maintenance change
-->

# Rei Das Esfihas Constitution

## Core Principles

### I. Requirements and Traceability First
Every product change MUST begin with a feature specification that defines user
stories, measurable acceptance criteria, edge cases, assumptions, and affected
domains. Requirements, plan, tasks, tests, and implementation MUST be traceable
to one another. Ambiguity in payments, payroll, stock, tenant isolation,
authentication, or data retention blocks implementation until clarified.

### II. Test the Rule Before Changing It
Any behavior change MUST add or update an automated test at the narrowest useful
level before implementation. Business rules require unit tests; API contract or
integration changes require integration tests; critical customer or operator
flows require an end-to-end acceptance test driven through browser navigation.
Any change that crosses the frontend/backend boundary MUST be exercised from the
real browser origin against the deployed environment so that routing, CORS,
authentication, environment variables, and request/response compatibility are
verified together. A defect fix MUST contain a regression test that fails on the
prior behavior. Pure documentation and non-behavioral formatting changes are the
only exceptions.

### III. Financial, HR, and Data Integrity Are Non-Negotiable
Changes affecting money, payroll, attendance, orders, inventory, or tenant data
MUST preserve historical records, enforce idempotency or natural uniqueness
where retries can occur, validate authorization server-side, and define recovery
or rollback behavior. Database migrations MUST be forward-only, safe for
existing production data, reversible by a documented compensating migration, and
validated against representative historical data before release.

### IV. Explicit Boundaries and Safe Contracts
Frontend code MUST use the established service boundary; it MUST NOT bypass API
authorization or encode server business rules. API changes MUST specify request
validation, authorization, response/error contracts, compatibility impact, and
tenant scoping. Secrets MUST remain in environment variables and never be
committed, logged, exposed to the client, or added to specifications.

### V. Reproducible Quality Gates
No feature is complete until its declared acceptance criteria pass and affected
quality gates run successfully. Backend changes MUST pass the Node test suite;
frontend changes MUST pass lint and production build; changes to critical flows
MUST include and pass their acceptance test. After deployment, every affected
web application MUST pass a browser-navigation smoke test against its published
URL. The test MUST confirm that the page loads, the affected journey completes,
and frontend requests reach the deployed backend without browser console, CORS,
network, or server errors. A direct health check, command-line HTTP request,
unit test, or successful build MUST NOT substitute for this browser gate. CI is
the source of merge truth; local success is supporting evidence only.

## Technical Constraints

- Frontend: React and Vite at `front-end/app/mock`; run commands from that
  directory with npm.
- Backend: Node.js ESM and Vercel Functions at `back-end`; domain rules live in
  `back-end/src/modules` and request handlers live in `back-end/api-handlers`.
- Persistence: Supabase migrations live in `supabase/migrations`; never modify
  an already-applied migration to change production behavior.
- Cross-boundary changes MUST document the frontend, API handler, domain rule,
  migration, and rollout impact, including intentionally unaffected boundaries.
- Browser acceptance and smoke tests MUST use the project-declared browser
  automation runner with user-visible locators and automatic readiness waits;
  fixed sleeps MUST NOT be used to conceal loading or synchronization defects.

## Development Workflow and Quality Gates

1. Use `$speckit-specify` to state the outcome and acceptance criteria.
2. Use `$speckit-clarify` for unresolved high-impact choices.
3. Use `$speckit-plan` to document architecture, data, contracts, rollout, and
   the Constitution Check.
4. Use `$speckit-checklist` to review requirement quality for the feature risk.
5. Use `$speckit-tasks` and require a test task before every behavior task.
6. Use `$speckit-analyze`; resolve every critical inconsistency before coding.
7. Use `$speckit-implement`; run the affected automated gates and record their
   results in the feature quickstart or pull request.
8. Deploy every affected web application, then navigate its published URL with
   browser automation and execute the affected user journey. Record the URL,
   journey, result, and any console or network failure evidence. A failed browser
   gate fails the deployment and blocks completion even when `/health`, tests,
   lint, and build have passed.
9. Use `$speckit-converge` after release or acceptance to reconcile intentional
   deviations and create follow-up work for unresolved items.

## Governance

This constitution supersedes ad-hoc implementation preferences. Each plan and
review MUST record compliance with all applicable principles and justify any
exception before implementation. Amendments require an updated constitution,
semantic version bump, Sync Impact Report, and review of templates and active
feature artifacts. Versioning follows semantic versioning: MAJOR for incompatible
principle changes, MINOR for new or materially expanded controls, and PATCH for
clarifications. Security or data-integrity exceptions require explicit owner,
expiry date, and compensating control.

**Version**: 1.1.0 | **Ratified**: 2026-08-14 | **Last Amended**: 2026-08-17
