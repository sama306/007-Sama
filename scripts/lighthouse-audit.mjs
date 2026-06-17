import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const urls = [
  'http://localhost:4321/',
  'http://localhost:4321/games',
  'http://localhost:4321/games/cyberpunk-2077',
];

const config = {
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};

for (const url of urls) {
  console.log(`\n=== Auditing: ${url} ===`);
  try {
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox'],
    });
    const results = await lighthouse(url, { port: chrome.port }, config);
    await chrome.kill();
    // Clean up temp dir manually
    try {
      const tmpDir = chrome.tmpDir?.name;
      if (tmpDir) {
        const { rmSync } = await import('fs');
        rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5 });
      }
    } catch {}
    if (results && results.lhr && results.lhr.categories) {
      const cats = results.lhr.categories;
      const scores = {};
      for (const [key, cat] of Object.entries(cats)) {
        scores[key] = cat.score;
      }
      console.log('Scores:', scores);
    } else {
      console.log('No results returned');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
