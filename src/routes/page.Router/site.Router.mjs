import express from "express";
const router = express.Router();
import asyncHandler from "../../helpers/asyncHandler.helper.mjs";
import siteController from "../../controllers/page.controller/site.controller.mjs";
import authUtils from "../../auth/authUtils.mjs";
const { handleRefreshToken, authorize, authentication } = authUtils;

// view render
router.get("/login", siteController.LoginPage);
router.get("/signup", siteController.SignupPage);

// form submit
router.post(
  "/signup",
  asyncHandler(siteController.HandleSignup.bind(siteController))
);
router.post(
  "/login",
  asyncHandler(siteController.HandleLogin.bind(siteController))
);

router.use(authentication);

router.use(handleRefreshToken);

router.get("/home", siteController.HomePage);

router.post("/logout", asyncHandler(siteController.HandleLogout));

export default router;
