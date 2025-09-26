import productFactory from "../../services/product.service.mjs";
import { BadRequestError, NotFoundError } from "../../core/error.response.mjs";
import { CreatedResponse } from "../../core/success.response.mjs";
import { getPaginationArray } from "../../utils/index.mjs";
class ProductController {
  // [GET] create
  CreatePage(req, res) {
    res.render("create", {
      layout: "main",
    });
  }

  // [GET] list product
  async getListProductOfUser(req, res, next) {
    const { limit, page, sort, order, ...filter } = req.query;
    const userId = req.userId;
    if (!userId) throw new BadRequestError("Invalid UserId");
    filter.product_shopId = userId;
    const products = await productFactory.showProducts({
      limit,
      page,
      sort,
      order,
      filter,
    });
    const totalProducts = await productFactory.countProducts(filter);
    if (!totalProducts) throw new BadRequestError("Invalid found products");
    const totalPage = Math.ceil(totalProducts / limit);
    const pagesArr = await getPaginationArray(Number(page) || 1, totalPage);
    res.render("product", {
      layout: "main",
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      products,
      totalPage,
      pagesArr,
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
