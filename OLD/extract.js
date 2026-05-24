const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatch = html.match(/<script type="text\/babel" data-type="module">([\s\S]*?)<\/script>/);

if (scriptMatch) {
  fs.writeFileSync('app.js', scriptMatch[1]);
  console.log('app.js created');
} else {
  console.log('No script found');
}
