const { Pool } = require('pg');

const pool = new Pool({
    user: 'divyanshshah',
    host: 'localhost',
    database: 'taskmanager',
    password: '',
    port: 5432,
});

module.exports = pool;