async function testAPI() {
  try {
    // First, get the actual JWT token by logging in
    console.log('1️⃣ Logging in as student shekhar...');
    const loginRes = await fetch('http://localhost:5004/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'shekhar', password: 'shekhar123' })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Logged in, token:', token?.substring(0, 50) + '...\n');

    // Now call the timetable endpoint
    console.log('2️⃣ Calling /api/timetables/for-current-student...');
    const res = await fetch('http://localhost:5004/api/timetables/for-current-student', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:');
    console.log(`  classId: ${data.classId}`);
    console.log(`  entries count: ${data.entries?.length || 0}`);
    console.log(`  First 3 entries:`, data.entries?.slice(0, 3));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testAPI();
