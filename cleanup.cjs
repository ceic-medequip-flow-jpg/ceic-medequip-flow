const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace any occurrence of the root rendering block
code = code.replace(/\/\/\s*A renderização agora usa os objetos globais ReactDOM e React\.\s*const root = ReactDOM\.createRoot\(document\.getElementById\('root'\)\);\s*root\.render\(<App \/>\);/gm, '');

fs.writeFileSync('src/App.jsx', code);
console.log('ReactDOM cleanup complete.');
