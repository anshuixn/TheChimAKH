/**
 * TEMPORARY DIAGNOSTIC SCRIPT — NOT A FIX.
 * Purpose: Capture actual browser state at each render step to determine
 * the true root cause of the black screen.
 * Must be removed before any final implementation.
 * Run with: node scripts/diagnose-blackscreen.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, '../test-results/diagnosis');
fs.mkdirSync(screenshotDir, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];

async function diagnose() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Diagnosing: ${vp.name} (${vp.width}x${vp.height}) ===`);

    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await ctx.newPage();

    // Collect all console messages
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Collect all network failures
    const networkFailures = [];
    page.on('requestfailed', (req) => {
      networkFailures.push({ url: req.url(), reason: req.failure()?.errorText });
    });

    // Inject diagnostic attributes BEFORE navigation via init script
    await ctx.addInitScript(() => {
      // Patch useState to expose device tier and home state as data-* attrs on body
      // We hook into the window for observation
      window.__DIAG_STATES = { tier: 'unknown', homeState: 'unknown', renderCount: 0 };
      
      // Capture original console.error/warn for stack traces
      const origError = console.error;
      const origWarn = console.warn;
      window.__DIAG_ERRORS = [];
      window.__DIAG_WARNS = [];
      
      console.error = (...args) => {
        window.__DIAG_ERRORS.push(args.map(String).join(' '));
        origError(...args);
      };
      console.warn = (...args) => {
        window.__DIAG_WARNS.push(args.map(String).join(' '));
        origWarn(...args);
      };
    });

    // Navigate to the local dev server
    const response = await page.goto('http://localhost:5173/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(e => ({ status: () => 'NAVIGATION_ERROR', error: e.message }));

    const httpStatus = typeof response.status === 'function' ? response.status() : response.status;
    console.log(`  HTTP status: ${httpStatus}`);

    // Screenshot immediately after domcontentloaded (before any useEffect)
    await page.screenshot({
      path: path.join(screenshotDir, `${vp.name}-01-domcontentloaded.png`),
      fullPage: false,
    });
    console.log(`  Screenshot 01: domcontentloaded`);

    // Gather computed styles of #root and body right now
    const stylesAtDCL = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;
      if (!root) return { rootExists: false };
      
      const rootStyle = getComputedStyle(root);
      const bodyStyle = getComputedStyle(body);
      
      // Check all potential black-screen containers
      const allDivs = root.querySelectorAll('div');
      const firstDiv = allDivs[0];
      const firstDivStyle = firstDiv ? getComputedStyle(firstDiv) : null;
      
      return {
        rootExists: true,
        rootChildren: root.children.length,
        rootInnerHTML: root.innerHTML.slice(0, 500),
        bodyBg: bodyStyle.backgroundColor,
        rootBg: rootStyle.backgroundColor,
        firstDivBg: firstDivStyle?.backgroundColor,
        firstDivZIndex: firstDivStyle?.zIndex,
        firstDivHeight: firstDivStyle?.height,
        firstDivDisplay: firstDivStyle?.display,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        errors: window.__DIAG_ERRORS,
        warns: window.__DIAG_WARNS,
      };
    });
    console.log('  Styles at DCL:', JSON.stringify(stylesAtDCL, null, 2));

    // Wait 100ms (before useEffect fires)
    await page.waitForTimeout(100);
    await page.screenshot({
      path: path.join(screenshotDir, `${vp.name}-02-before-useeffect.png`),
      fullPage: false,
    });

    // Wait for first useEffect to fire (React renders, useEffect fires, state update)
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, `${vp.name}-03-after-useeffect.png`),
      fullPage: false,
    });

    const stylesAfterUseEffect = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return { rootExists: false };
      
      // Look for specific components by their data-testid or CSS class substrings
      const allElements = root.querySelectorAll('*');
      const visibleTextContent = [];
      for (const el of allElements) {
        if (el.children.length === 0 && el.textContent?.trim()) {
          const style = getComputedStyle(el);
          visibleTextContent.push({
            tag: el.tagName,
            text: el.textContent.trim().slice(0, 100),
            color: style.color,
            display: style.display,
            opacity: style.opacity,
            visibility: style.visibility,
          });
        }
      }
      
      return {
        rootChildren: root.children.length,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        visibleTextSample: visibleTextContent.slice(0, 10),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        errors: window.__DIAG_ERRORS,
        warns: window.__DIAG_WARNS,
        diagStates: window.__DIAG_STATES,
      };
    });
    console.log('  Styles after useEffect:', JSON.stringify(stylesAfterUseEffect, null, 2));

    // Wait for full load including frame manifest fetch
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotDir, `${vp.name}-04-settled.png`),
      fullPage: false,
    });

    const settledState = await page.evaluate(() => {
      const root = document.getElementById('root');
      // Count all text nodes visible
      const allText = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent?.trim();
        if (t) allText.push(t);
      }
      
      return {
        allVisibleText: allText.slice(0, 20),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        errors: window.__DIAG_ERRORS,
        warns: window.__DIAG_WARNS,
      };
    });
    console.log('  Settled state:', JSON.stringify(settledState, null, 2));
    
    if (networkFailures.length > 0) {
      console.log('  NETWORK FAILURES:', JSON.stringify(networkFailures, null, 2));
    }
    if (consoleLogs.filter(l => l.type === 'error').length > 0) {
      console.log('  CONSOLE ERRORS:', consoleLogs.filter(l => l.type === 'error'));
    }

    await ctx.close();
  }

  await browser.close();
  console.log(`\nScreenshots saved to: ${screenshotDir}`);
}

diagnose().catch(console.error);
