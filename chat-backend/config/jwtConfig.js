const JWT_CONFIG = {
  accessSecret: "mySuperAccessSecretKey123!",
  refreshSecret: "mySuperRefreshSecretKey456!",
  accessExpires: "7d",
  refreshExpires: "7d",
  bcryptSalt: 10
};

module.exports = JWT_CONFIG;
