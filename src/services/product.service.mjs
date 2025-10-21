import { book, product, stationery } from "../models/product.model.mjs";
import { BadRequestError } from "../core/error.response.mjs";
class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_quantity,
    product_type,
    product_shopId,
    product_attributes,
  }) {
    this.product_name = product_name;
    this.product_thumb = product_thumb;
    this.product_description = product_description;
    this.product_price = product_price;
    this.product_quantity = product_quantity;
    this.product_type = product_type;
    this.product_shopId = product_shopId;
    this.product_attributes = product_attributes;
  }
  async CreateProduct(Product_id) {
    return await product.create({ ...this, _id: Product_id });
  }
}

class productFactory {
  static productRegistry = {};

  static registerProductType(type, classRef) {
    productFactory.productRegistry[type] = classRef;
  }

  static async createProduct(type, shopId, payload) {
    const productClass = productFactory.productRegistry[type];
    if (!productClass) {
      throw new BadRequestError(`Invalid Product Type ${type}`);
    }
    const newPayload = { ...payload, product_shopId: shopId };
    return await new productClass(newPayload).CreateProduct();
  }
  static async showProducts({
    limit = 50,
    page = 1,
    sort = "ctime",
    order = -1,
    filter = {},
    search = "",
  }) {
    const skip = (page - 1) * limit;
    if (search && search.trim() != "") {
      filter.$text = { $search: search.trim() };
    }
    const Products = await product
      .find(filter, search ? { score: { $meta: "textScore" } } : {})
      .populate("product_shopId", "UserName")
      .sort(search ? { score: { $meta: "textScore" } } : { [sort]: order })
      .skip(skip)
      .limit(limit)
      .lean();
    if (!Array.isArray(Products) || Products.length === 0) {
      return [];
    }

    return Products;
  }

  static async countProducts(filter = {}) {
    return await product.countDocuments(filter);
  }

  static async findProductByText(req, res) {}
}

class Book extends Product {
  async CreateProduct() {
    const newBook = await book.create(this.product_attributes);
    const newProduct = await super.CreateProduct(newBook._id);
    return { ...newProduct.toObject(), book: newBook };
  }
}

class Stationery extends Product {
  async CreateProduct() {
    const newStationery = await stationery.create(this.product_attributes);
    const newProduct = await super.CreateProduct(newStationery._id);
    return { ...newProduct.toObject(), stationery: newStationery };
  }
}

productFactory.registerProductType("Book", Book);
productFactory.registerProductType("Stationery", Stationery);

export default productFactory;
