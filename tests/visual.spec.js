// @ts-check
import { test, expect } from '@playwright/test';

const routes = ['/'];

/** @param {string} route */
function snapshotName(route) {
  return route === '/' ? 'home.png' : `${route.replaceAll('/', '_').replace(/^_/, '')}.png`;
}

for (const route of routes) {
  test(`visual: ${route}`, async ({ page }) => {
    await page.goto(route);
    // Wait for fonts, images, and lazy-loaded content to finish loading
    // before capturing the screenshot so the baseline is stable.
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(snapshotName(route), { fullPage: true });
  });
}
