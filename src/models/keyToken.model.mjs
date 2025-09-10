import mongoose from "mongoose";
const { Schema, model } = mongoose;

const keyTokenSchema = new Schema(
  {
    user: {
      // Định nghĩa trường user để lưu ID người dùng
      type: Schema.Types.ObjectId, // Kiểu dữ liệu là ObjectId, dùng để lưu ID duy nhất
      required: true, // Trường bắt buộc, không được để trống
      ref: "Customer", // Tham chiếu đến collection Customer để liên kết dữ liệu
    },
    privateKey: {
      // Định nghĩa trường privateKey để lưu khóa bí mật
      type: String, // Kiểu dữ liệu là chuỗi
      required: true, // Trường bắt buộc, không được để trống
    },
    publicKey: {
      // Định nghĩa trường publicKey để lưu khóa công khai
      type: String, // Kiểu dữ liệu là chuỗi
      required: true, // Trường bắt buộc, không được để trống
    },
    refreshTokensUsed: {
      //Những refreshTokens đã được sử dụng
      type: Array,
      default: [], // Giá trị mặc định là mảng rỗng nếu không có giá trị
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "keyTokens",
  }
);
export default model("KeyToken", keyTokenSchema);
