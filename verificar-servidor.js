const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tarefas',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status do servidor: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Resposta do servidor:', data);
    });
});

req.on('error', (error) => {
    console.error('Erro ao conectar com o servidor:', error.message);
});

req.end(); 