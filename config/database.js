const knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : '127.0.0.1',
        user     : 'root',
        password : 'root9379992',
        database : 'test',
        charset  : 'utf8'
  }
});
module.exports = require('bookshelf')(knex);