# Change: Setup DevOps Quality Assurance

## Problem Statement

Currently, the ImmoFacile project lacks automated quality gates:

1. **No pre-commit hooks** - Code can be committed without passing linting, formatting, or security checks
2. **No GitHub Actions CI/CD** - No automated validation on push/pull requests
3. **Inconsistent code quality** - Without enforcement, code style and quality may vary across contributors

This leads to potential issues being discovered late (or never), increased technical debt, and difficulty maintaining consistent code quality across the codebase.

## Proposed Solution

Implement a two-layer quality assurance system:

### Layer 1: Pre-commit Hooks (Local Enforcement)

Use **Husky** + **lint-staged** to run quality checks before commits:

| Check | Tool | Scope |
|-------|------|-------|
| Format | Prettier | Client + Server JS/JSX files |
| Lint | ESLint | Client + Server JS/JSX files |
| Security | npm audit | Dependencies (advisory only) |
| Build | Vite build (dry-run) | Client only (on staged changes) |

### Layer 2: GitHub Actions Workflows (CI Enforcement)

Create workflows that run on push and pull requests:

| Workflow | Triggers | Checks |
|----------|----------|--------|
| `ci.yml` | push, pull_request | Format, Lint, Build, Security audit |

## Tools Selection (Open-Source & Free)

| Purpose | Tool | License | Cost |
|---------|------|---------|------|
| Pre-commit management | Husky v9 | MIT | Free |
| Staged files runner | lint-staged | MIT | Free |
| Code formatting | Prettier | MIT | Free |
| JavaScript linting | ESLint (existing) | MIT | Free |
| Security scanning | npm audit (built-in) | N/A | Free |
| CI/CD | GitHub Actions | N/A | Free (public repos) |

## Scope

- **In scope**: Pre-commit hooks, GitHub Actions CI workflow, Prettier configuration
- **Out of scope**: Deployment workflows, end-to-end testing, Docker builds

## Impact

- **Affected code**: Root `package.json`, new config files at repo root
- **New files**: `.husky/`, `.prettierrc`, `.prettierignore`, `.github/workflows/ci.yml`
- **Modified files**: `package.json` (root), `client/package.json`, `server/package.json`

## Success Criteria

1. All commits are validated against format, lint, and security checks locally
2. GitHub Actions runs quality checks on every push and PR
3. Failed checks block merge (via GitHub branch protection rules)
4. All tools are open-source and free to use
5. Setup works without requiring any external paid services
