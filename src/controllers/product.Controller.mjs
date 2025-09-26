import productFactory from "../services/product.service.mjs";
import { BadRequestError } from "../core/error.response.mjs";
import { CreatedResponse } from "../core/success.response.mjs";
import productService from "../services/product.service.mjs";
class ProductController {
  // [POST] /api/products

  createProduct = async (req, res, next) => {
    const { product_type } = req.body;
    if (!product_type) throw new BadRequestError("Missing Product Type");
    if (!req.userId) throw new BadRequestError("Invalid UserId");
    const result = await productFactory.createProduct(
      product_type,
      req.userId,
      req.body
    );
    if (!result) throw new BadRequestError("Invalid Create Product");

    console.log("Controller finish!");
    new CreatedResponse({
      message: "Create Product Successfully",
      metaData: result,
    }).send(res);
  };
  // [GET] /api/products list all
  getListAllProduct = async (req, res, next) => {
    const { limit, page, sort, order, ...filter } = req.query;
    const products = await productService.showProducts({
      limit,
      page,
      sort,
      order,
      filter,
    });
    if (!products) throw new BadRequestError("Not found products");
    const totalProducts = await productService.countProducts(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    new CreatedResponse({
      message: "Get List Product Successfully",
      metaData: { products, totalPages, currentPage: Number(page) },
    }).send(res);
  };

  // [GET] /api/products list of user
  getListProductOfUser = async (req, res, next) => {
    const { limit, page, sort, order, ...filter } = req.query;
    const userId = req.userId;
    if (!userId) throw new BadRequestError("Invalid UserId");
    filter.product_shopId = userId;
    const products = await productService.showProducts({
      limit,
      page,
      sort,
      order,
      filter,
    });
    if (!products) throw new BadRequestError("Not found products");
    const totalProducts = await productService.countProducts(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    new CreatedResponse({
      message: "Get List Product Successfully",
      metaData: { products, totalPages, currentPage: Number(page) },
    }).send(res);
  };
}

export default new ProductController();
