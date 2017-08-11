'use strict';

const methodName = (
  // Method caption
  // First line description
  // second line of multiline method description
  a1, // number, comment
  // multiline comment
  // for first argument
  a2, // array of string
  a3 // comment
  // Returns: string, comment
  // Hint: message
  // Example: methodName(5, [2, 3], 'f')
  // Result: '52,3f'
) => {
  const s = a2.join();
  return a1 + s + a3;
};

module.exports = {
  methodName,
};
