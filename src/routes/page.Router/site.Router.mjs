import express from "express";
const router = express.Router();
import siteController from "../../controllers/page.controller/site.controller.mjs";

router.get("/login", siteController.LoginPage);

export default router;
