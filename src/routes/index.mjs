import express from "express";

import accessRouter from "./access.Router/index.mjs";
import pageRouter from "./page.Router/site.Router.mjs";
import productApiRouter from "../routes/product.api.Router/index.mjs";
import productViewRouter from "../routes/product.view.Router/index.mjs";

const router = express.Router();

router.use("/v1/api/product", productApiRouter);
router.use("/v1/api", accessRouter);
router.use("/v1/view", productViewRouter);
router.use("/", pageRouter);
export default router;
