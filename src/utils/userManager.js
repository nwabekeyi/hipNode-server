const users = new Map();

module.exports = {
  addUser: (userId, ws) => {
    users.set(userId, ws);
  },
  getUser: (userId) => {
    return users.get(userId);
  },
  removeUser: (ws) => {
    for (const [userId, connection] of users.entries()) {
      if (connection === ws) {
        users.delete(userId);
        return userId;
      }
    }
    return null;
  },
};