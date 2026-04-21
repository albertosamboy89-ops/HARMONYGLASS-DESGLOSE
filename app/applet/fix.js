import fs from 'fs';
const content = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');
const fixed = content.replace(/<\/motion\.div>\s+<\/motion\.div>/g, '</motion.div>');
fs.writeFileSync('/app/applet/src/App.tsx', fixed);
