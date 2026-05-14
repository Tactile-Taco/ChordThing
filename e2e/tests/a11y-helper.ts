import { Page } from '@playwright/test';
import { AxeResults, run } from 'axe-core';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export async function runA11yCheck(page: Page): Promise<AxeResults> {
  await page.addScriptTag({ path: require.resolve('axe-core') });
  const results = await page.evaluate(() => {
    return (window as any).axe.run();
  });
  return results as AxeResults;
}
