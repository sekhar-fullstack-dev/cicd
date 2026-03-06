# Banking CI/CD Sample App

Sample React banking application used to validate CI/CD quality gates with automated tests.

## Flows
- User registration and login
- Send money to another user
- Transaction verification (`pending -> success/failed`)
- Transaction history and balance updates

## Tech Stack
- Vite + React + TypeScript
- MSW mocked API layer
- Vitest + React Testing Library
- Playwright E2E
- GitHub Actions CI/CD + GitHub Pages deploy

## Commands
```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test:ci
npm run test:e2e
npm run build
```

## CI Gate
- `typecheck`, `lint`, `test:ci` (coverage thresholds 80%), and `test:e2e` must pass.
- On `main` push, successful build is deployed to GitHub Pages.
