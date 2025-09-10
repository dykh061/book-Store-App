import express from "express";
const router = express.Router();
import accessController from "../../controllers/access.Controller.mjs";
import asyncHandler from "../../helpers/asyncHandler.helper.mjs";
import authUtils from "../../auth/authUtils.mjs";
const { preAuthentication, authorize, authentication } = authUtils;

router.post("/signup", asyncHandler(accessController.SignUp));
router.post("/login", asyncHandler(accessController.Login));

//middleware preAuthentication
router.use(preAuthentication);

// kiểm tra accessToken
router.use(authentication);

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
