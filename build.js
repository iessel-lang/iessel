const pkg = require('pkg');
const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

async function build() {
    console.log('--- Starting Iessel Root Build ---');

    // 1. Define Root Directories
    const platforms = {
        win32: path.resolve(__dirname, 'win32'),
        unix: path.resolve(__dirname, 'unix'),
        macos: path.resolve(__dirname, 'macos')
    };

    // 2. Create folders if they don't exist
    Object.values(platforms).forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // 3. Compile via PKG
    // We output to a temp name to avoid conflicts during the move
    console.log('Compiling binaries...');
    await pkg.exec(['.', '--out-path', './temp_builds']);

    // 4. Move to Root Folders
    const mapping = [
        { from: 'temp_builds/iessel-win.exe', to: 'win32/iessel.exe' },
        { from: 'temp_builds/iessel-linux', to: 'unix/iessel' },
        { from: 'temp_builds/iessel-macos', to: 'macos/iessel' }
    ];

    mapping.forEach(file => {
        const oldPath = path.resolve(__dirname, file.from);
        const newPath = path.resolve(__dirname, file.to);
        
        if (fs.existsSync(oldPath)) {
            if (fs.existsSync(newPath)) fs.unlinkSync(newPath); // Remove old version if exists
            fs.renameSync(oldPath, newPath);
        }
    });

    // Clean up temp folder
    if (fs.existsSync('./temp_builds')) fs.rmSync('./temp_builds', { recursive: true });

    // 5. Apply Windows Icon (Windows Only)
    const winExe = path.join(platforms.win32, 'iessel.exe');
    const iconPath = path.resolve(__dirname, 'icons/logo.ico');

    if (fs.existsSync(winExe) && fs.existsSync(iconPath)) {
        console.log('Injecting icon into win32/iessel.exe...');
        try {
            await rcedit(winExe, { icon: iconPath });
            console.log('Icon successfully applied.');
        } catch (err) {
            console.error('Rcedit Error: Make sure icons/logo.ico is a valid .ico file.');
        }
    }

    console.log('--- Build Finished Successfully ---');
}

build();