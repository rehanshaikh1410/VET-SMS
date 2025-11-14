import fetch from 'node-fetch';

async function testTimetable() {
  try {
    // Use a valid JWT token - this should be from a real student login
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTEyZDBmNWE2MDJhMmFhYzZmY2EzZDciLCJ1c2VybmFtZSI6InNoZWtoYXIiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTczMDk0MzAzMzAwMH0.qvR1jLp3Y-d1Z-8Y8R8R8R8R8R8R8R8R';
    
    const res = await fetch('http://localhost:5004/api/timetables/for-current-student', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Timetable data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testTimetable();
