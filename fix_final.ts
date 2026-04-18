import fs from 'fs';
const f = 'src/App.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');
// We want to replace line 960 (index 959) which is '                )}'
// with '</>', then add ')}', then 'motion.div'
// Let's verify line 960 first in the script logic.
if (lines[959].trim() === ')}' && lines[960].trim() === '</motion.div>') {
    lines[959] = '                  </>';
    lines.splice(960, 0, '               )}');
    fs.writeFileSync(f, lines.join('\n'));
    console.log('Fixed Step 3 closure');
} else {
    console.log('Failed to match lines:', lines[959], lines[960]);
}
