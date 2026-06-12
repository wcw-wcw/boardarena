# StackMap Report

Generated: 2026-06-12 08:43:39

## Project Summary

- Repository: `connect_four`
- Path: `/Users/will/Workspace/connect_four`
- Files scanned: 53
- Findings: 0 high, 1 medium, 1 low, 0 info

## Detected Stack

- Languages: TypeScript, JavaScript
- Frameworks: none detected
- Databases: none detected
- Testing: none detected
- Deployment: Vercel

## File Overview

- Source files: 35
- Config files: 10
- Test files: 1
- Docs: 4

## Package Scripts

- `smoke:production`: `node scripts/smoke-production.mjs`
- `validate:local`: `node scripts/validate-local.mjs`

## Environment Variables

- `.env.example`: yes
- Missing from example: `CI`, `PUBLIC_API_BASE_URL`, `PUBLIC_FRONTEND_URL`

## API Routes

- `GET /api/health` in `backend/app/main.py` (medium confidence)
- `GET /health` in `backend/app/main.py` (medium confidence)
- `GET /{game_id}` in `backend/app/api/routes/games.py` (medium confidence)
- `POST /{game_id}/moves/ai` in `backend/app/api/routes/games.py` (medium confidence)
- `POST /{game_id}/moves/human` in `backend/app/api/routes/games.py` (medium confidence)

## Tests

- Test files: yes
- Test script: no
- Frameworks: Playwright

## Deployment Readiness

- README: yes
- `.env.example`: yes
- Dockerfile: no
- Vercel config: yes
- Health endpoint: yes
- Migration files: no

## Findings

- **medium / env**: Some environment variables used in code are missing from .env.example. (`frontend/.env.example`)
  Recommendation: Document the missing variables in .env.example.
- **low / tests**: Test files exist, but no package test script was found. (`package.json`)
  Recommendation: Add a test script so tests are easy to run locally and in CI.

## Recommended Next Steps

- Document the missing variables in .env.example.
- Add a test script so tests are easy to run locally and in CI.
