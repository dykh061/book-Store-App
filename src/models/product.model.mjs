import mongoose from "mongoose";
import slugify from "slugify";
const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    product_thumb: {
      type: String,
      required: true,
    },
    product_description: {
      type: String,
    },
    product_slug: String,
    product_price: {
      type: Number,
      required: true,
    },
    product_quantity: {
      type: Number,
      required: true,
    },
    product_variations: {
      type: Array,
      default: [],
    },
    isDraft: {
      type: Boolean,
      default: false,
      select: false,
      index: true,
    },
    isPublish: {
      type: Boolean,
      default: true,
      select: false,
      index: true,
    },
    product_type: {
      type: String,
      required: true,
      enum: ["Book", "Stationery"],
    },
    product_shopId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product_ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    product_attributes: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

productSchema.index(
  { product_name: "text", product_description: "text" },
  { weights: { product_name: 10, product_description: 2 } }
);

productSchema.pre("save", function (next) {
  this.product_slug = slugify(this.product_name, { lower: true });
  next();
});

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    publisher: {
      type: String,
      required: true,
    },
    publication_year: {
      type: Number,
      required: true,
    },
    isbn: {
      //(International Standard Book Number)
      type: String,
      required: true,
      unique: true,
    },
    genre: {
      type: String,
      enum: [
        "Fiction",
        "Non-Fiction",
        "Science",
        "Children",
        "Biography",
        "Fantasy",
        "Mystery",
        "Education",
      ],
      required: true,
    },
    language: {
      type: String,
      default: "Vietnamese",
    },
    format: {
      type: String,
      enum: ["Hardcover", "Paperback", "Ebook"],
      default: "Paperback",
    },
  },
  {
    collection: "books",
    timestamps: true,
  }
);

const stationerySchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "Pen",
        "Pencil",
        "Ruler",
        "Notebook",
        "Eraser",
        "Highlighter",
        "Glue",
        "Scissors",
      ],
    },
    brand: {
      type: String,
      required: true,
    },
    color: {
      type: String,
    },
    material: {
      type: String,
    },
    size: {
      type: String,
    },
    pack_quantity: {
      type: Number,
      default: 1,
    },
  },
  {
    collection: "stationerys",
    timestamps: true,
  }
);

export const product = model("product", productSchema);
export const book = model("book", bookSchema);
export const stationery = model("stationery", stationerySchema);
