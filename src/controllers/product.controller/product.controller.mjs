import productFactory from "../../services/product.service.mjs";
import { BadRequestError } from "../../core/error.response.mjs";
import { CreatedResponse } from "../../core/success.response.mjs";

class ProductController {
  // [GET] create
  CreatePage(req, res) {
    res.render("create", {
      layout: "main",
    });
  }
  // [POST] create
  async createProduct(req, res, next) {
    const { product_type } = req.body;
    if (!product_type) throw new BadRequestError("Missing Product Type");
    if (!req.userId) throw new BadRequestError("Invalid UserId");
    const result = await productFactory.createProduct(
      product_type,
      req.userId,
      req.body
    );
    if (!result) throw new BadRequestError("Invalid Create Product");
    res.redirect("/home");
  }
}

export default new ProductController();
