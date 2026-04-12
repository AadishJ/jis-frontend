# Selenium Use Case Tests

This folder contains a runnable Selenium WebDriver end-to-end suite for JIS use cases UC-01 to UC-07.

## Covered Use Cases

- UC-01 Create Case
- UC-02 Edit Case
- UC-03 Schedule Hearing
- UC-04 Record Adjournment
- UC-05 Close Case
- UC-06 View Pending Cases
- UC-07 Browse Closed Case (as Judge)

## Prerequisites

1. Frontend running (default base URL):

```bash
http://localhost:3000
```

2. Backend running (used by frontend API calls):

```bash
http://localhost:8080
```

3. Seed users available:

- Registrar userId: 1
- Judge userId: 2
- Password: pass

## Install

Dependencies are in devDependencies:

- selenium-webdriver
- chromedriver

If your package manager blocks install scripts for chromedriver, allow it with:

```bash
pnpm approve-builds
```

## Run

```bash
pnpm test:selenium
```

## Environment Variables

- E2E_BASE_URL (default: http://localhost:3000)
- E2E_REGISTRAR_USER_ID (default: 1)
- E2E_JUDGE_USER_ID (default: 2)
- E2E_PASSWORD (default: pass)
- E2E_ELEMENT_TIMEOUT_MS (default: 30000)
- E2E_TEST_TIMEOUT_MS (default: 600000)
- SELENIUM_BROWSER (default: chrome)
- SELENIUM_REMOTE_URL (optional Selenium Grid URL)
- SELENIUM_HEADLESS (default: true; set false for headed mode)
- E2E_DISABLE_WEB_SECURITY (default: true)

## CORS Note

The suite runs Chrome with web-security disabled by default to allow frontend-to-backend calls in local environments where backend CORS for case endpoints is restricted.

Set `E2E_DISABLE_WEB_SECURITY=false` only if your backend CORS is fully configured for browser-origin requests.
