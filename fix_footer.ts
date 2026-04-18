import fs from 'fs';
const f = 'src/App.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');
// Fix Step 3 closure if still messed up
if (lines[959].trim() === '</>') {
  // ok
} else {
  // try to find it
}

// Fix Footer closure
// Look at 1225-1228
if (lines[1225].trim() === ')}' && lines[1226].trim() === '</motion.div>') {
    lines[1225] = '          </motion.div>';
    lines[1226] = '       )}';
    fs.writeFileSync(f, lines.join('\n'));
    console.log('Fixed Footer closure');
} else {
    console.log('No match for footer at 1225:', lines[1225]);
}
