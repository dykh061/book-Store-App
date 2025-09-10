import express from "express";
const router = express.Router();
import accessController from "../../controllers/access.Controller.mjs";
import asyncHandler from "../../helpers/asyncHandler.helper.mjs";
import authUtils from "../../auth/authUtils.mjs";
const { handleRefreshToken, authorize, authentication } = authUtils;

router.post("/signup", asyncHandler(accessController.SignUp));
router.post("/login", asyncHandler(accessController.Login));

router.use(authentication);

router.use(handleRefreshToken);

router.post(
  "/reset-token",
  authorize("customer", "admin"),
  asyncHandler(accessController.ResetToken)
);

router.post(
  "/logout",
  authorize("customer", "admin"),
  asyncHandler(accessController.Logout)
);
export default router;
