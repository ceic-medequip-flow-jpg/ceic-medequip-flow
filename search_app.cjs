const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
    if (l.includes('mySectorPendingRequests')) console.log(i + 1, l.trim());
    if (l.includes('MyRequestsView =')) console.log(i + 1, l.trim());
    if (l.includes('request-card')) console.log(i + 1, l.trim());
});
