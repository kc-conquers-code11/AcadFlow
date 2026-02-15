const https = require('https');

const data = JSON.stringify({
    language: 'python',
    version: '3.10.0',
    files: [
        {
            content: 'print("Hello world")'
        }
    ]
});

const options = {
    hostname: 'emkc.org',
    port: 443,
    path: '/api/v2/piston/execute',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => {
        body += d;
    });
    res.on('end', () => {
        console.log(body);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
