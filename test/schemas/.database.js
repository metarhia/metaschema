({
  name: 'example',
  description: 'Example database schema',
  version: 3,
  driver: 'pg',

  authors: [
    { name: 'Timur Shemsedinov', email: 'timur.shemsedinov@gmail.com' },
  ],

  extensions: ['hstore', 'postgis', 'postgis_topology', 'pg_trgm'],

  connection: {
    host: '127.0.0.1',
    port: 5432,
    database: 'application',
    user: 'postgres',
    password: 'postgres',
  },
});
