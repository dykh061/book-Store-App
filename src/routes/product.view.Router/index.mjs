import express from "express";
const router = express.Router();
import result from "../../auth/authUtils.mjs";
import asyncHandler from "../../helpers/asyncHandler.helper.mjs";
const { authorize, authentication, handleRefreshToken } = result;
import productController from "../../controllers/product.controller/product.controller.mjs";

router.use(authentication);
router.use(handleRefreshToken);

router.get("/create", productController.CreatePage);
router.post(
  "/create",
  authorize("customer", "admin"),
  asyncHandler(productController.createProduct.bind(productController))
);

router.get(
  "/products",
  authorize("customer", "admin"),
  asyncHandler(productController.getListProductOfUser)
);
export default router;
