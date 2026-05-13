const fs = require('fs');
const path = require('path');
const readline = require('readline');
const vm = require('vm');
const Ilt = require('./ilt.js');

// ANSI Color Codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const LIGHT_BLUE = '\x1b[94m';
const RESET = '\x1b[0m';

function printError(err) {
    const stackLines = err.stack.split('\n');
    let isSyntaxError = err.name === 'SyntaxError';
    let headerIndex = stackLines.findIndex(line => line.includes(err.name + ':'));

    if (isSyntaxError && headerIndex > 0) {
        for (let i = 0; i < headerIndex; i++) {
            console.error(`${LIGHT_BLUE}${stackLines[i]}${RESET}`);
        }
    }

    const header = stackLines[headerIndex] || err.message;
    const firstColon = header.indexOf(':');
    const type = firstColon !== -1 ? header.substring(0, firstColon) : err.name;
    const reason = firstColon !== -1 ? header.substring(firstColon + 1) : header;
    console.error(`${RED}${type}${RESET}:${YELLOW}${reason}${RESET}`);

    for (let i = headerIndex + 1; i < stackLines.length; i++) {
        let line = stackLines[i];
        if (line.trim().startsWith('at')) {
            console.error(`${BLUE}${line.replace(/node:internal/g, 'objects:internal')}${RESET}`);
        }
    }
}

process.on('uncaughtException', (err) => {
    printError(err);
    process.exit(1);
});

require.extensions['.il'] = function(module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const compiled = Ilt.translate(content, filename);
    module._compile(compiled, filename);
};

const targetFile = process.argv[2];

if (targetFile) {
    const absolutePath = path.resolve(process.cwd(), targetFile);
    require(absolutePath);
} else {
    // --- REPL MODE ---
    // Welcome message in Dark Red
    console.log(`${RED}Iessel 1.4.0, (C) The Iessel Developers${RESET}\n`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });

    let buffer = "";
    rl.prompt();

    rl.on('line', (line) => {
        if (line.trim().toLowerCase() === 'exit') rl.close();

        buffer += line + "\n";

        const openBraces = (buffer.match(/{/g) || []).length;
        const closeBraces = (buffer.match(/}/g) || []).length;

        if (openBraces > closeBraces) {
            rl.setPrompt('??? ');
            rl.prompt();
        } else {
            try {
                const compiled = Ilt.translate(buffer);
                const script = new vm.Script(compiled);
                script.runInThisContext();
            } catch (err) {
                printError(err);
            }
            
            buffer = "";
            rl.setPrompt('> ');
            rl.prompt();
        }
    });

    rl.on('close', () => {
        process.exit(0);
    });
}