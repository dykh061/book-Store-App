import express from "express";
const router = express.Router();
import productController from "../../controllers/product.Controller.mjs";
import result from "../../auth/authUtils.mjs";
import asyncHandler from "../../helpers/asyncHandler.helper.mjs";
const { authorize, authentication, handleRefreshToken } = result;

router.use(authentication);
router.use(handleRefreshToken);
router.post(
  "/create",
  authorize("customer", "admin"),
  asyncHandler(productController.createProduct)
);

export default router;
