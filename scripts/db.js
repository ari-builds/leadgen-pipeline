const {createClient} = require('@libsql/client');
const path = require('path');

const db = createClient({
  url: 'file:' + path.join(__dirname, '..', 'local.db'),
});

module.exports = db;
