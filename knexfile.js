require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.PGHOST,
    migrations: {
      directory: './db/migrations',
    },
    seeds: {
      directory: './db/seeds/dev',
    },
    useNullAsDefault: true,
  },
};
