/* Local preview without Vercel:  ST366_API=https://…/exec node dev.js  → http://localhost:3000 */
const http = require('http'), handler = require('./api/index');
http.createServer((req, res) => handler(req, res)).listen(3000, () => console.log('http://localhost:3000'));
