const fs = require('fs');
const path = require('path');
const Ilt = require('../il/ilt.js');

// ANSI Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2);
let compiledCount = 0;

// Flag Parsing
const flags = {
    js: args.includes('-js'),
    ts: args.includes('-ts'),
    all: args.includes('-compile-all-il-is-files'),
    outDir: 'dist_ilc' // Default
};

// Handle -o flag: check for "-o" and get the next argument
const oIndex = args.indexOf('-o');
if (oIndex !== -1 && args[oIndex + 1]) {
    flags.outDir = args[oIndex + 1];
}

function compileFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));
    const targetExt = flags.ts ? '.ts' : '.js';
    
    let compiled = Ilt.translate(content, filePath);

    const outPath = path.join(flags.outDir, fileName + targetExt);
    
    if (!fs.existsSync(flags.outDir)) fs.mkdirSync(flags.outDir, { recursive: true });
    
    fs.writeFileSync(outPath, compiled);
    
    compiledCount++;
    console.log(`    ${GREEN}Compiled:${RESET}${filePath}`);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // Avoid recursion into node_modules or the output folder
            if (file !== 'node_modules' && file !== path.basename(flags.outDir)) walkDir(fullPath);
        } else {
            if (file.endsWith('.il') || file.endsWith('.is')) {
                compileFile(fullPath);
            }
        }
    });
}

// Execution
console.log(`${BLUE}build started${RESET}`);

if (flags.all) {
    walkDir(process.cwd());
} else {
    const file = args.find(a => a.endsWith('.il') || a.endsWith('.is'));
    if (file) {
        compileFile(path.resolve(process.cwd(), file));
    }
}

console.log(`${BLUE}build succeded, ${compiledCount} compiled${RESET}`);