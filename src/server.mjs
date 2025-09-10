import express from "express";
const app = express();

import router from "./routes/index.mjs";
import { engine } from "express-handlebars";
import instanceMongoDB from "./db/init.mongodb.mjs";
import cookieParser from "cookie-parser";

import configs from "./configs/configs.mongodb.mjs";

const { port: PORT } = configs.app;

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// setup static files
app.use(express.static(path.join(__dirname, "public")));

//template engine setup
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "views"));

// parse cookie
app.use(cookieParser());

// init router
app.use("", router);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
