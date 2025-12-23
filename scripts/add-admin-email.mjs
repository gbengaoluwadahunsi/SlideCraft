import http from 'http';

const email = 'gbengaoluwadahunsi01@gmail.com';
const note = 'Owner - Primary Admin';
const adminSecret = '03fde2ec42d5a726a6245c2054597d3506b80d31b41f6018e112405306990568';

const data = JSON.stringify({ email, note });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/emails',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': adminSecret,
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    if (res.statusCode === 200) {
      console.log('\n✅ Admin email added successfully!');
      console.log(`📧 ${email} now has unlimited free access.`);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();

