import http from 'http';

http.get('http://127.0.0.1:3000/src/main.tsx', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response code:', res.statusCode, '\nBody:', data.substring(0, 500)));
}).on('error', (err) => console.error('Error:', err.message));
