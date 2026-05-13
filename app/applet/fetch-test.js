const http = require('http');

http.get('http://127.0.0.1:3000', {
  headers: {
    'Accept': 'text/html'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response code:', res.statusCode, '\nBody:', data.substring(0, 1000)));
}).on('error', (err) => console.error('Error:', err.message));
