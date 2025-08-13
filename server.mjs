import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;
import router from "./src/routes/index.mjs";

// init router
router(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
