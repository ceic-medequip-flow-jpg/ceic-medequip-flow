const fs = require('fs');
const babel = require('@babel/standalone');

const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatch = html.match(/<script type="text\/babel" data-type="module">([\s\S]*?)<\/script>/) || html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (scriptMatch) {
  const code = scriptMatch[1];
  try {
     babel.transform(code, { presets: ['react'] });
     console.log("Babel Transform OK");
  } catch(e) {
     console.error("Syntax Error:\n", e.message);
  }
} else {
  console.log("No babel script found");
}
