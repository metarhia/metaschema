'use strict';

const methodName = (
  // Method description
  par1, // number, comment
  par2, // array of string
  par3 // comment
  // Returns: string, comment
  // Hint: message
  // Example: methodName(5, [2, 3])
) => {
  const s = par2.join();
  return par1 + s + par3;
};

module.exports = {
  methodName,
};
