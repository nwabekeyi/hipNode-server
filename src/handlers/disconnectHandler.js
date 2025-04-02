const userManager = require('../utils/userManager');

module.exports = (ws) => {
  const userId = userManager.removeUser(ws); // Remove user from the map
  if (userId) {
    console.log(`User ${userId} disconnected`);
  }
};