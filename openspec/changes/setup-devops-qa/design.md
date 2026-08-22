# Design: DevOps Quality Assurance Architecture

## Overview

This document describes the architecture for the quality assurance system, including pre-commit hooks and GitHub Actions workflows.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Developer Workflow                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Local Development                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Write     │─▶│   Stage     │─▶│   Commit    │                  │
│  │   Code      │  │   Changes   │  │   (git)     │                  │
│  └─────────────┘  └─────────────┘  └──────┬──────┘                  │
│                                           │                          │
│                                           ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Husky Pre-commit Hook                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │ Prettier │─▶│  ESLint  │─▶│npm audit │─▶│ Build Check  │  │   │
│  │  │ (format) │  │  (lint)  │  │(security)│  │   (client)   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │   │
│  │                                                               │   │
│  │  ✓ Pass: Commit proceeds    ✗ Fail: Commit blocked           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (git push)
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    GitHub Actions CI                          │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │                    ci.yml Workflow                      │  │   │
│  │  │                                                         │  │   │
│  │  │  Triggers: push (main, develop), pull_request           │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐   │  │   │
│  │  │  │ Install │─▶│ Format  │──│  Lint   │─▶│ Security │   │  │   │
│  │  │  │  Deps   │  │  Check  │  │  Check  │  │  Audit   │   │  │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └────┬─────┘   │  │   │
│  │  │                                              │         │  │   │
│  │  │                                              ▼         │  │   │
│  │  │                                        ┌──────────┐    │  │   │
│  │  │                                        │  Build   │    │  │   │
│  │  │                                        │  Client  │    │  │   │
│  │  │                                        └──────────┘    │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  │  ✓ All pass: PR can merge    ✗ Any fail: PR blocked          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Husky Pre-commit Hooks

**Technology**: Husky v9 + lint-staged

**Configuration Files**:
- `.husky/pre-commit` - Git hook script
- `package.json` - lint-staged configuration

**Flow**:
```
git commit → .husky/pre-commit → npx lint-staged → [checks] → commit or abort
```

**lint-staged configuration** (in root `package.json`):
```json
{
  "lint-staged": {
    "client/**/*.{js,jsx}": [
      "prettier --write",
      "eslint --fix"
    ],
    "server/**/*.js": [
      "prettier --write"
    ]
  }
}
```

### 2. Prettier Configuration

**Shared configuration** for consistent formatting across client and server:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

**Ignored paths** (`.prettierignore`):
- `node_modules/`
- `dist/`
- `build/`
- `*.min.js`
- Database files
- Generated PDFs

### 3. GitHub Actions Workflow

**Workflow file**: `.github/workflows/ci.yml`

**Triggers**:
- `push` to `main` and `develop` branches
- `pull_request` to `main` and `develop` branches

**Job matrix**:

| Job | Runs on | Steps |
|-----|---------|-------|
| `quality` | ubuntu-latest | Install → Format check → Lint → Security audit → Build |

**Caching strategy**:
- Cache `node_modules` for faster CI runs
- Use npm ci for deterministic installs

### 4. Security Considerations

**npm audit**:
- Run as advisory in pre-commit (warns but doesn't block)
- Run with `--audit-level=high` in CI (blocks on high/critical vulnerabilities)

**Rationale**:
- Local: Allow development to continue when low/moderate vulnerabilities exist
- CI: Block merges only for serious security issues

## Trade-offs

| Decision | Alternative | Rationale |
|----------|------------|-----------|
| Husky over pre-commit (Python) | pre-commit framework | Husky is JS-native, no Python dependency |
| Prettier for formatting | ESLint --fix only | Prettier is faster and more consistent |
| npm audit over Snyk | Snyk, Dependabot | npm audit is built-in and free |
| Single CI job | Parallel jobs | Simpler setup, adequate for project size |

## Compatibility

- **Node.js**: 18+ (LTS requirement from project.md)
- **npm**: 9+ (required for npm audit improvements)
- **Git**: 2.9+ (required for hooks directory support)
- **Husky**: v9 (requires npm 8+)

## Rollback Plan

If issues arise:
1. Remove Husky: `npm uninstall husky && rm -rf .husky`
2. Disable workflow: Delete `.github/workflows/ci.yml`
3. All quality tools are optional dependencies with no runtime impact
