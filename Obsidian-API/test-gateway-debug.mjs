import axios from 'axios';

const instance = {
  url: 'http://localhost:4002',
  instanceId: 'test-123'
};

const endpoint = '/health';
const url = `${instance.url}${endpoint}`;

console.log('Instance URL:', instance.url);
console.log('Endpoint:', endpoint);
console.log('Full URL:', url);
console.log('URL type:', typeof url);

const config = {
  method: 'GET',
  url,
  headers: {
    'X-Service-Name': 'booking',
    'X-Instance-ID': instance.instanceId,
  },
};

console.log('Config:', JSON.stringify(config, null, 2));

const client = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Obsidian-API-Gateway/1.0',
  },
  validateStatus: () => true,
});

client.request(config)
  .then(response => {
    console.log('Success! Status:', response.status);
    console.log('Data:', response.data);
  })
  .catch(error => {
    console.log('Error:', error.message);
    console.log('Error code:', error.code);
    console.log('Error config:', error.config);
  });

