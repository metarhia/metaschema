'use strict';

const metaschema = require('..');

metaschema.load('geometry', (err, schema) => {
  if (err) throw err;
  const geometry = metaschema.build(schema);

  // Function contract guard

  const buyTickets = (
    event, // number, event id
    count, // number, ticket count
    address // string, delivery address
    // Returns: boolean, success status
  ) => {
    metaschema.guard({ event, count, address });
    console.dir({ event, count, address });
    return true;
  };

  buyTickets(101, 2, 'Kiev, Pobedy 37');

});
