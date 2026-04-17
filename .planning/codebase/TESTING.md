# Testing

## Frameworks & Tools
- **E2E Testing:** Playwright is integrated (`scripts/requirements-daily.txt` and `playwright` devDependency hint at browser-side e2e).
- **Types & Linting:** Standard `next lint` and `tsc` cover the foundational static analysis.

## Test Approach (Inferred from dependencies)
- **Unit Testing:** No specific large-runner like Jest or Vitest is heavily indicated in the root `package.json`, suggesting unit tests might be lightweight or rely on Playwright strictly for integration tests alongside functional validations.
- **Integration/E2E:** `record_playwright.js` points to UI automation/E2E test suite running for scraping or assertion tasks.

## How to Run Tests
- **Linting:** Run `npm run lint`.
- **Typing:** Run `npx tsc --noEmit`.
- **E2E:** Playwright commands typically `npx playwright test`.
