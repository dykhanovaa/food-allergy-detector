# Testing Model

## Critical user scenarios

1. User registration, login, logout and session restore.
2. Viewing and editing the profile allergy list.
3. Role-based access to admin actions.
4. Uploading an image for allergen analysis and receiving a result.
5. Viewing, filtering, paginating and deleting scan history.
6. Public barcode lookup flow through the external product API.
7. Graceful handling of backend errors, expired sessions and unavailable integrations.

## Business rules and constraints

- Authentication is cookie-based and protected routes must reject anonymous requests.
- A user cannot register twice with the same email.
- Only admins can access `/api/admin/*` endpoints.
- An admin cannot change their own role.
- Allergy updates replace the current selection and must reference existing allergy ids.
- Scan upload accepts only supported image MIME types and file extensions.
- Scan list supports filtering, sorting and pagination.
- Barcode lookup must return product data for a successful external response and an error for missing products.

## High-risk areas

- Authentication/session cookies and token refresh.
- Role checks and access control.
- File upload, OCR pipeline and scan persistence.
- Object storage integration for upload/delete/presigned links.
- External API integration with Open Food Facts.
- Frontend recovery from `401`, `403`, validation errors and network failures.

## Test structure

- `backend/tests/test_services.py`
  Unit tests for backend services and external API wrappers.
- `backend/tests/test_auth.py`
  Integration tests for authentication endpoints and cookie lifecycle.
- `backend/tests/test_users_admin.py`
  Integration tests for profile, allergies and admin role flows.
- `backend/tests/test_scans.py`
  Integration tests for scan CRUD, SEO endpoints, file validation and barcode lookup.
- `frontend/tests/*.test.tsx`
  Component and scenario tests for auth, profile, scan list, barcode lookup and app-level session logic.
- `frontend/tests/api.scans.test.ts`
  Frontend API utility tests.
- `frontend/e2e/*.spec.ts`
  Playwright checks for session restore, logout, login, analyze, scan list and barcode lookup flows.

## Test suite split

- `unit`
  Fast isolated service/helper checks.
- `integration`
  FastAPI endpoint tests with isolated SQLite state and mocked integrations.
- `e2e`
  Playwright scenarios with mocked backend responses and a real frontend runtime.

## Isolation and infrastructure

- Backend tests use an isolated SQLite database and dependency overrides.
- State is rolled back between tests.
- OCR, object storage and external API calls are mocked where deterministic behavior is required.
- Frontend unit tests run in `jsdom`.
- E2E tests mock backend endpoints with `page.route(...)`.

## Run commands

- Backend: `venv\Scripts\python.exe -m pytest -q`
- Frontend unit/integration: `node node_modules/vitest/vitest.mjs run`
- Frontend build: `node node_modules/vite/bin/vite.js build`
- Frontend E2E: `node node_modules/@playwright/test/cli.js test`

## Current verification

- Backend: `31 passed`
- Frontend Vitest: `15 passed`
- Frontend Playwright: `2 passed`
