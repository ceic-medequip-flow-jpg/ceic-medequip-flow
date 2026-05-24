const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The first line was already corrected to `import { supabase } from './supabaseClient';` using replace_file_content tool.
// Let's replace any remaining `supabaseClient` variables inside the code with `supabase`.
// We should be careful NOT to accidentally replace `./supabaseClient` in the import statement!

code = code.replace(/supabaseClient/g, 'supabase');
// Restore the import if it was corrupted
code = code.replace(/import { supabase } from '\.\/supabase';/, "import { supabase } from './supabaseClient';");

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed supabaseClient variable names');
