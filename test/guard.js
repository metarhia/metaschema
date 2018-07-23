'use strict';

const metaschema = require('..');

// Function contract guard

const buyTickets = (
  // Buy N tickets for given event
  event, // number, event id
  count, // number, ticket count
  address // string, delivery address
  // Returns: boolean, success status
) => {
  metaschema.guard(buyTickets, { event, count, address });
  return true;
};

buyTickets(101, 2, 'Kiev, Pobedy 37');
try {
  buyTickets(101, '2', 37);
} catch (e) {
  console.log(e.message);
}
