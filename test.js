fetch('http://127.0.0.1:3000')
  .then(res => res.text())
  .then(t => console.log(t.substring(0, 200)))
  .catch(console.error);
