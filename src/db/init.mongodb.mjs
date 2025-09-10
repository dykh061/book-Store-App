import dev from "../configs/configs.mongodb.mjs";
import mongoose from "mongoose";
const { host: HOST, port: PORT, name: NAME } = dev.db;

const connectionString = `mongodb://${HOST}:${PORT}/${NAME}`;

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    return mongoose
      .connect(connectionString)
      .then(() =>
        console.log(`Connected to database: ${NAME} at ${HOST}:${PORT}`)
      )
      .catch((err) => {
        console.error(`Failed to connect to database: ${err.message}`);
        throw err;
      });
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instanceMongoDB = Database.getInstance();
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to the database");
});
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});
export default instanceMongoDB;
