import productFactory from "../services/product.service.mjs";
import { BadRequestError } from "../core/error.response.mjs";
import { CreatedResponse } from "../core/success.response.mjs";
class ProductController {
  // [POST] /api/products

  createProduct = async (req, res, next) => {
    const { product_type } = req.body;
    const result = await productFactory.createProduct(product_type, req.body);
    if (!result) throw new BadRequestError("Invalid Create Product");

    console.log("Controller finish!");
    new CreatedResponse({
      message: "Create Product Successfully",
      metaData: result.metaData,
    }).send(res);
  };
}

export default new ProductController();
