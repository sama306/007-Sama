import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'public', 'og-default.png');

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0a0a0f"/>
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="96"
    font-weight="700"
    fill="#8b5cf6"
  >007-Sama</text>
</svg>
`;

await sharp(Buffer.from(svg))
  .resize(width, height)
  .png()
  .toFile(outputPath);

console.log(`OG image generated: ${outputPath}`);
