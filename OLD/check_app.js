const fs = require('fs');
const babel = require('@babel/standalone');

const code = fs.readFileSync('app.js', 'utf-8');
try {
  babel.transform(code, { presets: ['react'] });
  console.log("Babel Transform OK");
} catch(e) {
  console.error("Syntax Error:\n", e.message);
}
