const data = JSON.stringify({
  studentUsername: 'shekhar',
  className: 'TYBCA (Grade 15)'
});

console.log('Assigning student shekhar to class TYBCA (Grade 15)...');
console.log('Request body:', data);

fetch('http://localhost:5004/api/assign-student-by-classname', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: data
})
  .then(res => {
    console.log(`Status: ${res.status}`);
    return res.json();
  })
  .then(json => {
    console.log('Response:', JSON.stringify(json, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
