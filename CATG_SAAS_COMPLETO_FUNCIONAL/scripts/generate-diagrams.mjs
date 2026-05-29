#!/usr/bin/env node

import { existsSync, readdirSync } from 'fs';
import { join, parse } from 'path';
import puppeteer from 'puppeteer';
import { run } from '../node_modules/@mermaid-js/mermaid-cli/src/index.js';

const diagramsDir = join(process.cwd(), 'docs', 'diagrams');
const bgColor = '#ffffff';

console.log('🎨 Generando diagramas SVG y PNG desde archivos .mmd...\n');

if (!existsSync(diagramsDir)) {
  console.error(`❌ La carpeta ${diagramsDir} no existe.`);
  process.exit(1);
}

const mmdFiles = readdirSync(diagramsDir).filter((file) => file.endsWith('.mmd')).sort();

if (mmdFiles.length === 0) {
  console.warn(`⚠️  No se encontraron archivos .mmd en ${diagramsDir}`);
  process.exit(0);
}

console.log(`📋 Encontrados ${mmdFiles.length} archivos .mmd\n`);

let successCount = 0;
let errorCount = 0;

const browser = await puppeteer.launch({
  headless: true,
  timeout: 120000,
  protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

try {
  for (const mmdFile of mmdFiles) {
    const inputPath = join(diagramsDir, mmdFile);
    const { name } = parse(mmdFile);
    const svgPath = join(diagramsDir, `${name}.svg`);
    const pngPath = join(diagramsDir, `${name}.png`);
    const isFullProjectDiagram = name === 'proyecto-completo';
    const renderOptions = {
      browser,
      quiet: true,
      parseMMDOptions: {
        backgroundColor: bgColor,
        viewport: {
          width: isFullProjectDiagram ? 3600 : 1800,
          height: isFullProjectDiagram ? 2400 : 1200,
          deviceScaleFactor: isFullProjectDiagram ? 2 : 1
        }
      }
    };

    try {
      console.log(`  → Generando ${name}.svg...`);
      await run(inputPath, svgPath, { ...renderOptions, outputFormat: 'svg' });
      console.log(`     ✅ ${name}.svg`);

      console.log(`  → Generando ${name}.png...`);
      await run(inputPath, pngPath, { ...renderOptions, outputFormat: 'png' });
      console.log(`     ✅ ${name}.png`);

      successCount++;
    } catch (error) {
      console.error(`  ❌ Error al procesar ${mmdFile}:`);
      console.error(`     ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }
  }
} finally {
  await browser.close();
}

console.log(`\n${'='.repeat(50)}`);
console.log('✨ Generación completada:');
console.log(`   ✅ ${successCount} diagramas exitosos`);
if (errorCount > 0) console.log(`   ❌ ${errorCount} errores`);
console.log('\n📂 Archivos SVG y PNG disponibles en: docs/diagrams/');
console.log('\n💡 Para abrir los diagramas:');
console.log('   start docs\\diagrams\\flujo-general.svg');
console.log('   start docs\\diagrams\\proyecto-completo.svg');

if (errorCount > 0) process.exit(1);
