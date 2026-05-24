const fs = require('fs');

const html = fs.readFileSync('legacy_index.html', 'utf8');

const startIndex = html.indexOf('<script type="text/babel">');
if (startIndex === -1) {
    console.error('Could not find <script type="text/babel">');
    process.exit(1);
}

const scriptContent = html.slice(startIndex + '<script type="text/babel">'.length);
const endIndex = scriptContent.indexOf('</script>');

let babelCode = scriptContent.slice(0, endIndex);

// Replace React destructuring
babelCode = babelCode.replace(
    /const\s+{\s*useState,\s*useMemo,\s*useEffect,\s*useRef\s*}\s*=\s*React;/g,
    "import React, { useState, useMemo, useEffect, useRef } from 'react';"
);

// Replace ReactDOM destructuring
babelCode = babelCode.replace(
    /const\s+{\s*createPortal\s*}\s*=\s*ReactDOM;/g,
    "import { createPortal } from 'react-dom';"
);

// Replace LucideReact destructuring
babelCode = babelCode.replace(
    /const\s+{([^}]+)}\s*=\s*(?:lucideReact|LucideReact);/g,
    "import { $1 } from 'lucide-react';"
);

// Replace window.supabaseClient with imported supabaseClient
// First, add the import at the top
babelCode = "import { supabaseClient } from './supabaseClient';\n" + babelCode;

// Replace window.supabaseClient references
babelCode = babelCode.replace(/window\.supabaseClient/g, 'supabaseClient');

// Final wrapper
const finalCode = `${babelCode}

export default App;
`;

fs.writeFileSync('src/App.jsx', finalCode);
console.log('Successfully extracted and converted App.jsx');
