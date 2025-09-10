import express from "express";

import accessRouter from "./access.Router/index.mjs";
import pageRouter from "./page.Router/site.Router.mjs";
const router = express.Router();

router.use("/v1/api", accessRouter);
router.use("/", pageRouter);
export default router;
