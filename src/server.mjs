import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;
import router from "./routes/index.mjs";
import { engine } from "express-handlebars";

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//template engine setup
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "views"));

// init router
router(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
