import productFactory from "../../services/product.service.mjs";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../core/error.response.mjs";
import { CreatedResponse } from "../../core/success.response.mjs";
import { getPaginationArray } from "../../utils/index.mjs";
class ProductController {
  // [GET] create
  CreatePage(req, res) {
    res.render("create", {
      layout: "main",
    });
  }

  //[GET] search product
  async getListSearchProduct(req, res) {
    const {
      sort,
      order,
      limit: rawLimit,
      page: rawPage,
      search,
      ...filter
    } = req.query;
    const limit = Number(rawLimit) || 50;
    const page = Number(rawPage) || 1;
    const Products = await productService.showProducts({
      page,
      limit,
      sort,
      order,
      search,
      filter,
    });

    if (Products.length === 0) {
      return res.render("textSearch", {
        products: [],
        message: "Không có sản phẩm nào",
      });
    }
    const totalProducts = await productService.countProducts(filter);
    if (!totalProducts) throw new BadRequestError("Invalid found products");
    const totalPage = Math.ceil(totalProducts / limit);
    const pagesArr = await getPaginationArray(Number(page) || 1, totalPage);
    res.render("textSearch", {
      layout: "main",
      page,
      limit,
      Products,
      totalPage,
      pagesArr,
    });
  }

  // [GET] list product
  async getListProductOfUser(req, res, next) {
    const {
      sort,
      order,
      limit: rawLimit,
      page: rawPage,
      ...filter
    } = req.query;
    const limit = Number(rawLimit) || 50;
    const page = Number(rawPage) || 1;
    const userId = req.userId;
    if (!userId) {
      const e = new UnauthorizedError();
      e.action = "LOGIN_REQUIRED";
      e.redirectTo = req.originalUrl;
      throw e;
    }
    filter.product_shopId = userId;
    const products = await productFactory.showProducts({
      limit,
      page,
      sort,
      order,
      filter,
    });
    if (products.length === 0) {
      return res.render("product", {
        products: [],
        message: "Không có sản phẩm nào",
      });
    }
    const totalProducts = await productFactory.countProducts(filter);
    if (!totalProducts) throw new BadRequestError("Invalid found products");
    const totalPage = Math.ceil(totalProducts / limit);
    const pagesArr = await getPaginationArray(Number(page) || 1, totalPage);
    res.render("product", {
      layout: "main",
      page,
      limit,
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
