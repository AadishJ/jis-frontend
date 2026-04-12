import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const REGISTRAR_USER_ID = Number(process.env.E2E_REGISTRAR_USER_ID ?? "1");
const JUDGE_USER_ID = Number(process.env.E2E_JUDGE_USER_ID ?? "2");
const LOGIN_PASSWORD = process.env.E2E_PASSWORD ?? "pass";
const ELEMENT_TIMEOUT_MS = Number(
  process.env.E2E_ELEMENT_TIMEOUT_MS ?? "30000",
);
const TEST_TIMEOUT_MS = Number(process.env.E2E_TEST_TIMEOUT_MS ?? "600000");
const DISABLE_WEB_SECURITY = process.env.E2E_DISABLE_WEB_SECURITY !== "false";

function nextIsoDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function sectionXPath(title) {
  return `//div[.//h2[normalize-space()=\"${title}\"]]`;
}

function inputByLabel(label, sectionTitle = "") {
  const prefix = sectionTitle ? `${sectionXPath(sectionTitle)}//` : "//";
  return By.xpath(
    `${prefix}label[.//span[normalize-space()=\"${label}\"]]//input`,
  );
}

function textareaByLabel(label, sectionTitle = "") {
  const prefix = sectionTitle ? `${sectionXPath(sectionTitle)}//` : "//";
  return By.xpath(
    `${prefix}label[.//span[normalize-space()=\"${label}\"]]//textarea`,
  );
}

async function buildDriver() {
  const browser = process.env.SELENIUM_BROWSER ?? "chrome";
  const seleniumServerUrl = process.env.SELENIUM_REMOTE_URL;

  const builder = new Builder().forBrowser(browser);

  if (seleniumServerUrl) {
    builder.usingServer(seleniumServerUrl);
  }

  if (browser === "chrome") {
    const options = new chrome.Options();

    if (process.env.SELENIUM_HEADLESS !== "false") {
      options.addArguments("--headless=new");
    }

    options.addArguments(
      "--window-size=1440,1200",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    );

    if (DISABLE_WEB_SECURITY) {
      const profileDir = path.join(
        os.tmpdir(),
        `jis-selenium-chrome-${Date.now()}`,
      );

      options.addArguments(
        "--disable-web-security",
        "--allow-running-insecure-content",
        `--user-data-dir=${profileDir}`,
      );
    }

    builder.setChromeOptions(options);
  }

  return builder.build();
}

async function waitForVisible(driver, locator, timeout = ELEMENT_TIMEOUT_MS) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

async function clickElement(driver, locator) {
  const element = await waitForVisible(driver, locator);

  try {
    await element.click();
  } catch {
    await driver.executeScript("arguments[0].click()", element);
  }
}

async function clearAndType(driver, locator, value) {
  const input = await waitForVisible(driver, locator);
  await input.click();
  await input.sendKeys(Key.chord(Key.CONTROL, "a"), Key.BACK_SPACE);
  await input.sendKeys(value);
}

async function setFieldValue(driver, locator, value) {
  const input = await waitForVisible(driver, locator);
  const type = await input.getAttribute("type");

  if (type === "date") {
    await driver.executeScript(
      "const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); descriptor.set.call(arguments[0], arguments[1]); arguments[0].dispatchEvent(new Event('input', { bubbles: true })); arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      input,
      value,
    );
    return;
  }

  await clearAndType(driver, locator, value);
}

async function loginAsUserId(driver, userId) {
  await driver.get(`${BASE_URL}/login`);

  await clearAndType(
    driver,
    By.css('input[placeholder="User ID"]'),
    String(userId),
  );
  await clearAndType(
    driver,
    By.css('input[placeholder="Password"]'),
    LOGIN_PASSWORD,
  );
  await clickElement(driver, By.xpath("//button[normalize-space()='Login']"));

  await waitForVisible(driver, By.xpath("//h1[normalize-space()='Dashboard']"));
}

async function logoutIfPossible(driver) {
  const logoutButtons = await driver.findElements(
    By.xpath("//button[normalize-space()='Logout']"),
  );

  if (logoutButtons.length === 0) {
    return;
  }

  await logoutButtons[0].click();
  await waitForVisible(
    driver,
    By.xpath("//h2[normalize-space()='Login to JIS']"),
  );
}

test(
  "JIS Selenium use cases UC-01 to UC-07",
  { timeout: TEST_TIMEOUT_MS },
  async (t) => {
    const driver = await buildDriver();

    let createdCin = "";
    let scheduledHearingId = 0;

    const runId = Date.now();
    const initialDefendantName = `Selenium Defendant ${runId}`;
    const updatedDefendantName = `${initialDefendantName} Updated`;
    const initialCrime = "Theft";
    const updatedCrime = "Fraud";
    const hearingDate = nextIsoDate(3);
    const nextHearingDate = nextIsoDate(8);
    const judgmentSummary = `Judgment from Selenium run ${runId}`;

    try {
      await t.test("Login as registrar", async () => {
        await loginAsUserId(driver, REGISTRAR_USER_ID);
      });

      await t.test("UC-01 Create Case", async () => {
        await driver.get(`${BASE_URL}/cases/create`);
        await waitForVisible(
          driver,
          By.xpath("//h1[normalize-space()='Create Case']"),
        );

        await setFieldValue(
          driver,
          inputByLabel("Defendant Name"),
          initialDefendantName,
        );
        await setFieldValue(driver, inputByLabel("Defendant Address"), "Delhi");
        await setFieldValue(
          driver,
          inputByLabel("Lawyer Name"),
          "Advocate Selenium",
        );
        await setFieldValue(driver, inputByLabel("Crime Type"), initialCrime);
        await setFieldValue(
          driver,
          inputByLabel("Date Of Offense"),
          nextIsoDate(-3),
        );
        await setFieldValue(
          driver,
          inputByLabel("Location Of Offense"),
          "Delhi",
        );
        await setFieldValue(
          driver,
          inputByLabel("Arresting Officer"),
          "Inspector Test",
        );
        await setFieldValue(
          driver,
          inputByLabel("Date Of Arrest"),
          nextIsoDate(-2),
        );
        await setFieldValue(
          driver,
          inputByLabel("Public Prosecutor"),
          "PP Selenium",
        );
        await setFieldValue(
          driver,
          inputByLabel("Presiding Judge"),
          "Judge Selenium",
        );
        await setFieldValue(
          driver,
          inputByLabel("Trial Start Date"),
          nextIsoDate(-1),
        );
        await setFieldValue(
          driver,
          inputByLabel("Expected Completion Date"),
          nextIsoDate(20),
        );

        await clickElement(
          driver,
          By.xpath("//button[normalize-space()='Create Case']"),
        );

        await waitForVisible(
          driver,
          By.xpath("//p[contains(., 'Case created successfully')]"),
        );

        const openLink = await waitForVisible(
          driver,
          By.xpath("//a[starts-with(normalize-space(), 'Open CIN-')]"),
        );
        const openText = await openLink.getText();
        const cinMatch = openText.match(/CIN-\d{4}-[A-Za-z0-9]+/);

        assert.ok(cinMatch, `Expected CIN in create output, got: ${openText}`);
        createdCin = cinMatch[0];
      });

      await t.test("UC-06 View Pending Cases", async () => {
        assert.ok(
          createdCin,
          "Created CIN should be available before pending-case checks",
        );

        await driver.get(`${BASE_URL}/cases/pending`);
        await waitForVisible(
          driver,
          By.xpath("//h1[normalize-space()='Pending Cases']"),
        );

        const expectedColumns = [
          "CIN",
          "Case Start",
          "Defendant",
          "Address",
          "Crime Details",
          "Lawyer",
          "Public Prosecutor",
          "Attending Judge",
          "Action",
        ];

        for (const column of expectedColumns) {
          await waitForVisible(
            driver,
            By.xpath(`//th[normalize-space()=\"${column}\"]`),
          );
        }

        const caseRow = await waitForVisible(
          driver,
          By.xpath(
            `//table//tr[td[contains(normalize-space(), \"${createdCin}\")]]`,
          ),
        );
        const rowText = await caseRow.getText();

        assert.match(rowText, new RegExp(createdCin));
        assert.match(rowText, new RegExp(initialDefendantName));

        const cinCells = await driver.findElements(
          By.xpath("//table//tbody//tr/td[1]"),
        );
        const cinValues = (
          await Promise.all(cinCells.map((cell) => cell.getText()))
        ).map((value) => value.trim());

        const sorted = [...cinValues].sort((first, second) =>
          first.localeCompare(second),
        );
        assert.deepEqual(
          cinValues,
          sorted,
          "Pending cases should be sorted by CIN",
        );
      });

      await t.test("UC-02 Edit Case", async () => {
        assert.ok(
          createdCin,
          "Created CIN should be available before edit-case checks",
        );

        await driver.get(`${BASE_URL}/cases/${createdCin}`);
        await waitForVisible(
          driver,
          By.xpath(`//h1[normalize-space()=\"${createdCin}\"]`),
        );

        await setFieldValue(
          driver,
          inputByLabel("Defendant Name", "UC-02: Edit Case"),
          updatedDefendantName,
        );
        await setFieldValue(
          driver,
          inputByLabel("Crime Type", "UC-02: Edit Case"),
          updatedCrime,
        );

        await clickElement(
          driver,
          By.xpath(
            `${sectionXPath("UC-02: Edit Case")}//button[contains(., 'Save Case Changes')]`,
          ),
        );

        await waitForVisible(
          driver,
          By.xpath("//p[contains(., 'Case details updated successfully')]"),
        );

        await driver.navigate().refresh();
        await waitForVisible(
          driver,
          By.xpath(`//h1[normalize-space()=\"${createdCin}\"]`),
        );

        const defendantInput = await waitForVisible(
          driver,
          inputByLabel("Defendant Name", "UC-02: Edit Case"),
        );
        const persistedValue = await defendantInput.getAttribute("value");
        assert.equal(persistedValue, updatedDefendantName);
      });

      await t.test("UC-03 Schedule Hearing", async () => {
        await setFieldValue(
          driver,
          inputByLabel("Hearing Date", "UC-03: Schedule Hearing"),
          hearingDate,
        );

        await clickElement(
          driver,
          By.xpath(
            `${sectionXPath("UC-03: Schedule Hearing")}//button[contains(., 'Schedule Hearing')]`,
          ),
        );

        await waitForVisible(
          driver,
          By.xpath("//p[contains(., 'Hearing scheduled on')]"),
        );

        const hearingInfo = await waitForVisible(
          driver,
          By.xpath("//p[contains(., 'Last scheduled hearing ID:')]"),
        );
        const hearingText = await hearingInfo.getText();
        const hearingMatch = hearingText.match(/(\d+)/);

        assert.ok(hearingMatch, `Expected hearing ID in text: ${hearingText}`);
        scheduledHearingId = Number(hearingMatch[1]);
      });

      await t.test("UC-04 Record Adjournment", async () => {
        assert.ok(
          scheduledHearingId > 0,
          "Hearing ID should be available before adjournment",
        );

        await setFieldValue(
          driver,
          inputByLabel("Hearing ID", "UC-04: Record Adjournment / Proceedings"),
          String(scheduledHearingId),
        );
        await setFieldValue(
          driver,
          inputByLabel(
            "New Hearing Date",
            "UC-04: Record Adjournment / Proceedings",
          ),
          nextHearingDate,
        );
        await clearAndType(
          driver,
          textareaByLabel(
            "Adjournment Reason",
            "UC-04: Record Adjournment / Proceedings",
          ),
          "Judge unavailable",
        );
        await clearAndType(
          driver,
          textareaByLabel(
            "Proceedings Summary (if hearing took place)",
            "UC-04: Record Adjournment / Proceedings",
          ),
          "Witness statements were recorded before adjournment.",
        );

        await clickElement(
          driver,
          By.xpath(
            `${sectionXPath("UC-04: Record Adjournment / Proceedings")}//button[contains(., 'Record Adjournment / Proceedings')]`,
          ),
        );

        await waitForVisible(
          driver,
          By.xpath(
            "//p[contains(., 'Adjournment/proceedings recorded and hearing rescheduled')]",
          ),
        );
      });

      await t.test("UC-05 Close Case", async () => {
        await clearAndType(
          driver,
          textareaByLabel("Judgment Summary", "UC-05: Close Case"),
          judgmentSummary,
        );

        await clickElement(
          driver,
          By.xpath(
            `${sectionXPath("UC-05: Close Case")}//button[contains(., 'Close Case')]`,
          ),
        );

        await waitForVisible(
          driver,
          By.xpath("//p[contains(., 'Case closed successfully')]"),
        );

        await waitForVisible(
          driver,
          By.xpath(
            "//div[.//h2[normalize-space()='Case Overview']]//p[contains(., 'Status:') and contains(., 'CLOSED')]",
          ),
        );
      });

      await t.test("UC-07 Browse Closed Case as Judge", async () => {
        assert.ok(
          createdCin,
          "Created CIN should be available before closed-case access",
        );

        await logoutIfPossible(driver);
        await loginAsUserId(driver, JUDGE_USER_ID);

        await driver.get(`${BASE_URL}/cases/closed`);
        await waitForVisible(
          driver,
          By.xpath("//h1[normalize-space()='Closed Cases']"),
        );

        await clearAndType(
          driver,
          By.css('input[placeholder="CIN (e.g. CIN-2026-xxxxxx)"]'),
          createdCin,
        );

        await clickElement(
          driver,
          By.xpath("//button[normalize-space()='Access Closed Case']"),
        );

        await waitForVisible(
          driver,
          By.xpath("//p[contains(., 'Closed case opened successfully')]"),
        );

        await waitForVisible(
          driver,
          By.xpath(
            `//p[.//span[normalize-space()='CIN:'] and contains(., \"${createdCin}\")]`,
          ),
        );
        await waitForVisible(
          driver,
          By.xpath(
            "//p[.//span[normalize-space()='Status:'] and contains(., 'CLOSED')]",
          ),
        );
        await waitForVisible(
          driver,
          By.xpath(
            `//div[.//p[contains(., 'Judgment Summary')]]//p[contains(., \"${judgmentSummary}\")]`,
          ),
        );
      });
    } finally {
      await driver.quit();
    }
  },
);
