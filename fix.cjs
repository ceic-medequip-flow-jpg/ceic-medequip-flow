const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(/export default App;/g, '');
code += '\nexport default App;\n';

// ALSO: We need to remove the duplicate `export default function App() {` 
// and change it to `function App() {` just in case.
code = code.replace(/export default function App/g, 'function App');

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed src/App.jsx exports');
