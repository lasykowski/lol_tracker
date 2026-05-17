const fs = require('fs');
const glob = require('fs').globSync;
const path = require('path');

const files = glob('frontend/src/**/*.{ts,tsx}');
let fallbackUrl = 'http://localhost:3001';

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('"http://localhost:3001')) {
        // Use standard template literal or process.env logic
        // E.g., replace "http://localhost:3001/api..." with `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api...`
        content = content.replace(/"http:\/\/localhost:3001/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}` + "');
        fs.writeFileSync(f, content);
        console.log('Fixed', f);
    }
});
