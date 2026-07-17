import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

async function walkForTsxFiles(rootDir) {
  const results = [];
  const pending = [rootDir];

  while (pending.length) {
    const currentDir = pending.pop();
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
        continue;
      }
      if (entry.isFile() && fullPath.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  }

  results.sort();
  return results;
}

function transpileTsxToJsx(sourceText, sourceFileName) {
  const transpiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      esModuleInterop: true,
      isolatedModules: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: sourceFileName,
    reportDiagnostics: true,
  });

  if (transpiled.diagnostics?.length) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(transpiled.diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    });
    throw new Error(`TypeScript transpile diagnostics for ${sourceFileName}:\n${formatted}`);
  }

  return transpiled.outputText;
}

async function main() {
  const repoRoot = process.cwd();
  const targetDir = path.join(repoRoot, 'src', 'app', 'dashboard', '(modules)', 'procurement');

  const tsxFiles = await walkForTsxFiles(targetDir);
  if (!tsxFiles.length) {
    // console.log('No .tsx files found under:', targetDir);
    return;
  }

  let converted = 0;
  for (const tsxFile of tsxFiles) {
    const jsxFile = tsxFile.slice(0, -4) + '.jsx';
    const source = await fs.readFile(tsxFile, 'utf8');
    const output = transpileTsxToJsx(source, path.basename(tsxFile));

    await fs.writeFile(jsxFile, output, 'utf8');
    await fs.unlink(tsxFile);
    converted += 1;
  }

  // console.log(`Converted ${converted} files.`);
}

await main();
