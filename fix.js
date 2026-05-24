const fs = require('fs');
const file = 'c:/Users/Jesus Cavalcante/Documents/CEIC_App/src/App.jsx';
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(/supabaseClient/g, 'supabase');
content = content.replace(/from '\.\/supabase'/g, "from './supabaseClient'");
fs.writeFileSync(file, content);
console.log("Done");