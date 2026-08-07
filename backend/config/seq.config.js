const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  "admin_globalhcubeslfj",
  "globalhcubeslfj",
  "4%maqwU$f30EbdEn",
  {
    dialect: "mysql",
    host: "43.242.226.140",
    logging: false,
  }
);
module.exports = sequelize;
