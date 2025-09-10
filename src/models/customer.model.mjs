import mongoose from "mongoose";

const { Schema, model } = mongoose;

const customerSchema = new Schema(
  {
    // UserName: Tên người dùng, bắt buộc và không được trùng
    UserName: {
      type: String,
      required: true,
      trim: true,
    },

    // Phone: Số điện thoại của khách hàng, có thể để trống
    Phone: {
      type: String,
      trim: true,
    },

    // Email: Địa chỉ email của khách hàng, phải là duy nhất
    Email: {
      type: String,
      trim: true,
    },

    // Password: Mật khẩu của khách hàng, bắt buộc, ít nhất 6 ký tự, không được truy xuất khi lấy dữ liệu
    Password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // mật khẩu sẽ không được chọn khi truy vấn
    },

    // Address: Địa chỉ của khách hàng, có thể để trống
    Address: {
      type: String,
      trim: true,
    },

    // roles: Các vai trò của khách hàng, có thể là 'customer', 'admin', hoặc 'manager', mặc định là 'customer'
    roles: {
      type: [String],
      enum: ["customer", "admin"],
      default: ["customer"],
    },
  },
  { timestamps: true }
);

export default model("Customer", customerSchema);
