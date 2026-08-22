# Tasks: Setup DevOps Quality Assurance

## 1. Configure Prettier (Formatting)

- [x] 1.1 Create `.prettierrc` at repository root with shared formatting rules
- [x] 1.2 Create `.prettierignore` to exclude build artifacts and dependencies
- [x] 1.3 Add `prettier` as dev dependency in root `package.json`
- [x] 1.4 Add `format` and `format:check` scripts to root `package.json`
- [x] 1.5 Verify: Run `npm run format:check` and confirm it executes without errors

## 2. Configure Husky Pre-commit Hooks

- [x] 2.1 Add `husky` and `lint-staged` as dev dependencies in root `package.json`
- [x] 2.2 Add `prepare` script to initialize Husky on `npm install`
- [x] 2.3 Create `.husky/pre-commit` hook that runs lint-staged
- [x] 2.4 Configure `lint-staged` in root `package.json` to run format + lint checks
- [x] 2.5 Verify: Husky hooks installed successfully on npm install

## 3. Add ESLint for Server

- [x] 3.1 Add `eslint` as dev dependency in `server/package.json`
- [x] 3.2 Create `server/eslint.config.js` with Node.js configuration
- [x] 3.3 Add `lint` script to `server/package.json`
- [x] 3.4 Verify: Run `cd server && npm run lint` without errors (warnings OK)

## 4. Create Root-level Quality Scripts

- [x] 4.1 Add `lint` script to root `package.json` that runs lint in both client and server
- [x] 4.2 Add `lint:fix` script to auto-fix linting issues
- [x] 4.3 Add `security:audit` script for npm audit
- [x] 4.4 Add `ci:check` script that runs all quality checks together
- [x] 4.5 Verify: Run `npm run ci:check` successfully

## 5. Create GitHub Actions CI Workflow

- [x] 5.1 Create `.github/workflows/` directory
- [x] 5.2 Create `ci.yml` workflow with Node.js 18 setup
- [x] 5.3 Configure workflow triggers (push to main/develop, pull_request)
- [x] 5.4 Add npm cache for faster CI runs
- [x] 5.5 Add format check step
- [x] 5.6 Add lint step for client and server
- [x] 5.7 Add security audit step (npm audit --audit-level=high)
- [x] 5.8 Add client build step
- [x] 5.9 Verify: Push to branch and confirm GitHub Actions runs successfully

## 6. Documentation

- [x] 6.1 Update README.md with quality assurance section
- [x] 6.2 Document available npm scripts for quality checks
- [x] 6.3 Document branch protection recommendations

## Dependencies

- Task 2 depends on Task 1 (lint-staged uses Prettier)
- Task 4 depends on Tasks 1, 2, and 3 (aggregates all checks)
- Task 5 can run in parallel with Tasks 1-4
- Task 6 depends on completion of Tasks 1-5

## Parallelizable Work

Tasks 1, 3, and 5 can begin in parallel as they don't depend on each other.
