const userManager = require('../utils/userManager');

module.exports = (ws, data) => {
  if (data.userId) {
    userManager.addUser(data.userId, ws); // Add user to the connected users map
    console.log(`User ${data.userId} authenticated`);
  }
};