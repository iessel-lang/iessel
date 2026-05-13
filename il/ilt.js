// il/ilt.js
const path = require('path');
const fs = require('fs');

const Ilt = {
    translate(code, currentFilePath = "") {
        let lines = code.split('\n');
        
        // Use the folder of the file being translated as the starting point
        // If no path is provided, fall back to the current working directory
        const baseDir = currentFilePath ? path.dirname(currentFilePath) : process.cwd();

        return lines.map(line => {
            // 1. Package logic
            line = line.replace(/\bpackage\s+([a-zA-Z0-9.]+);/g, (match, pkg) => {
                let parts = pkg.split('.');
                let build = "global";
                return parts.map(p => {
                    build += "." + p;
                    return `${build} = ${build} || {};`;
                }).join(' ');
            });

            // 2. Smart Import (Folder-Aware)
            line = line.replace(/\bimport\s+([a-zA-Z0-9.]+);/g, (match, dotPath) => {
                // Node Tooling (Koffi)
                if (dotPath === 'node.tools.ffi.koffi') {
                    let structure = `global.iessel = global.iessel || {}; global.iessel.node = global.iessel.node || {}; global.iessel.node.tools = global.iessel.node.tools || {}; global.iessel.node.tools.ffi = global.iessel.node.tools.ffi || {};`;
                    return `${structure} global.iessel.node.tools.ffi.koffi = require('koffi');`;
                }

                // Node Std Modules
                if (dotPath.startsWith('node.std.')) {
                    const nodeModuleName = dotPath.replace('node.std.', '');
                    let structure = `global.iessel = global.iessel || {}; global.iessel.node = global.iessel.node || {}; global.iessel.node.std = global.iessel.node.std || {};`;
                    return `${structure} global.iessel.node.std.${nodeModuleName} = require('${nodeModuleName}');`;
                }

                // --- LOCAL MODULE RESOLUTION ---
                let cleanFsPath = dotPath.startsWith('iessel.') ? dotPath.replace('iessel.', '') : dotPath;
                const fsPath = cleanFsPath.split('.').join(path.sep) + '.il';
                
                // Resolve relative to the file being opened
                const absoluteModulePath = path.resolve(baseDir, fsPath).replace(/\\/g, '/');

                const targetVariable = dotPath.startsWith('iessel.') ? dotPath : `iessel.${dotPath}`;
                let build = "global";
                let parts = targetVariable.split('.');
                let structure = parts.map((p, i) => {
                    build += "." + p;
                    return i < parts.length - 1 ? `${build} = ${build} || {};` : "";
                }).join(' ');

                return `${structure} ${build} = require('${absoluteModulePath}');`;
            });

            // 3. Methods & Keywords (Whitespace Fix Included)
            line = line.replace(/\bfunc\s+([#a-zA-Z0-9_]+)[\s\n]*\(/g, '$1(');
            line = line.replace(/\bprivate\s+([a-zA-Z0-9_]+)/g, '#$1');
            line = line.replace(/\bpublic\s+/g, '');
            line = line.replace(/\bprint\b/g, 'console.log');
            
            return line;
        }).join('\n');
    }
};

module.exports = Ilt;