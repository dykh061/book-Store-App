import express from "express";

import pageRouter from "./page.Router/site.Router.mjs";
import productViewRouter from "../routes/product.view.Router/index.mjs";

const router = express.Router();

router.use("/v1/view", productViewRouter);
router.use("/", pageRouter);
export default router;
