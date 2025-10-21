/**
 * @file AccessService
 * @description
 *  Đóng vai trò là tầng "business logic" cho toàn bộ luồng xác thực người dùng (authentication flow).
 *
 *  Mục đích:
 *    - Đảm bảo tính an toàn và tính toàn vẹn của quá trình xác thực.
 *    - Cung cấp cơ chế token rotation an toàn chống token reuse.
 *    - Tách biệt hoàn toàn nghiệp vụ đăng nhập / đăng ký / refresh token khỏi tầng HTTP.
 *
 *  Thành phần tương tác:
 *    - `customerModel`: Truy cập thông tin người dùng từ MongoDB.
 *    - `keyTokenService`: Lưu / cập nhật / xóa key RSA và token liên quan.
 *    - `authUtils`: Sinh và xác thực JWT, tạo cặp khóa RSA.
 *
 *  Thiết kế bảo mật:
 *    - Mỗi user có một cặp RSA key riêng (public/private) được lưu trong DB.
 *    - Refresh token được xoay vòng (rotated) theo cách "atomic" để chống race-condition.
 *    - Có cơ chế phát hiện reuse token hoặc refresh trùng lặp.
 */

import customerModel from "../models/customer.model.mjs";
import authUtils from "../auth/authUtils.mjs";
import bcrypt from "bcrypt";
import { getInfoData } from "../utils/index.mjs";
import keyTokenService from "./keyToken.service.mjs";
import { NotFoundError } from "../core/error.response.mjs";
import { UnauthorizedError } from "../core/error.response.mjs";
import { generateKeyPair } from "../utils/index.mjs";
const { HEADER, createTokenPair } = authUtils;

class AccessService {
  /**
   * @method handleRefreshToken
   * @description
   *  Dùng để cấp lại access/refresh token mới khi access token hết hạn.
   *
   *  Mục tiêu:
   *    - Ngăn chặn việc reuse refresh token (dấu hiệu bị đánh cắp).
   *    - Đảm bảo chỉ có *một* refresh token hợp lệ tồn tại tại một thời điểm.
   *    - Thực hiện cập nhật "atomic" trong DB để tránh race condition khi có nhiều request đồng thời.
   *
   *  Luồng:
   *    1. Kiểm tra xem refreshToken có trong danh sách token đã dùng chưa.
   *    2. Nếu token không khớp hoặc đã dùng → thu hồi key và yêu cầu đăng nhập lại.
   *    3. Nếu hợp lệ → tạo cặp token mới, cập nhật DB và trả về cho client.
   *
   * @param {Object} params
   * @param {String} params._id - ID người dùng
   * @param {String} params.Email - Email người dùng
   * @param {String} params.refreshToken - Refresh token hiện tại từ client
   * @param {Object} params.keyCustomers - Thông tin key/token hiện tại trong DB
   * @throws {UnauthorizedError|NotFoundError} Nếu token không hợp lệ hoặc user không tồn tại
   * @returns {Object} Cặp token mới và key cập nhật
   */
  static handleRefreshToken = async ({
    _id,
    Email,
    refreshToken,
    keyCustomers,
  }) => {
    // Ngăn chặn reuse token — nếu refresh token đã bị dùng rồi => hủy toàn bộ session
    if (keyCustomers.refreshTokensUsed.includes(refreshToken)) {
      await keyTokenService.deleteKeyById(_id);
      const e = new UnauthorizedError(
        "Refresh token has been used. Please log in again."
      );
      e.action = "LOGIN_REQUIRED";
      e.redirectTo = "/login";
      throw e;
    }
    // Nếu refresh token không khớp với token hiện tại trong DB => từ chối
    if (refreshToken !== keyCustomers.refreshToken) {
      const e = new UnauthorizedError("Refresh Token not valid");
      e.action = "LOGIN_REQUIRED";
      e.redirectTo = "/login";
      throw e;
    }
    // Đảm bảo user tồn tại trong hệ thống
    const foundUserEmail = await customerModel.findOne({ Email }).lean();
    if (!foundUserEmail) {
      const e = new NotFoundError("User not registered in system");
      e.action = "LOGIN_REQUIRED";
      e.redirectTo = "/login";
      throw e;
    }

    const userId = _id;

    // Sinh lại cặp token mới dựa trên key hiện tại
    const tokens = await createTokenPair(
      { userId, Email },
      keyCustomers.publicKey,
      keyCustomers.privateKey
    );
    // Cập nhật token trong DB theo cơ chế atomic (đảm bảo an toàn khi có nhiều request song song)
    const newKey = await keyTokenService.updateKeyToken({
      _id,
      tokens,
      refreshToken,
    });
    return {
      code: 200,
      message: "Get new Tokens successfully",
      metadata: {
        tokens,
        newKey,
      },
    };
  };
  /**
   * @method Logout
   * @description
   *  Kết thúc phiên đăng nhập hiện tại của user.
   *  Xóa cặp key/token khỏi DB để vô hiệu hóa toàn bộ session đang hoạt động.
   *
   * @param {String} userId - ID người dùng
   * @returns {Promise<Object>} Kết quả xóa key trong DB
   */
  static Logout = async (userId) => {
    const deKey = await keyTokenService.deleteKeyById(userId);
    return deKey;
  };

  /**
   * @method SignUp
   * @description
   *  Đăng ký tài khoản mới cho người dùng.
   *
   *  Mục tiêu:
   *    - Tạo user mới trong DB.
   *    - Sinh cặp RSA key và cặp token đầu tiên (access/refresh).
   *    - Lưu key/token vào DB cho user.
   *
   *  Lưu ý bảo mật:
   *    - Mật khẩu được hash bằng bcrypt (saltRounds=10).
   *    - Chỉ trả về thông tin tối thiểu cần thiết cho client.
   *
   * @param {Object} userData - Thông tin người dùng nhập từ form đăng ký
   * @throws {UnauthorizedError} Nếu email đã tồn tại
   * @returns {Object} Thông tin user mới và cặp token
   */
  static SignUp = async ({ userData }) => {
    const { UserName, Phone, Email, Password, Address, roles } = userData;

    // Ngăn trùng email
    const userEmail = await customerModel.findOne({ Email }).lean();
    if (userEmail) {
      throw new UnauthorizedError("Email already registered!");
    }

    // Hash mật khẩu trước khi lưu
    const passwordHash = await bcrypt.hash(Password, 10);

    // Tạo user mới
    const newUser = await customerModel.create({
      UserName,
      Phone,
      Email,
      Password: passwordHash,
      Address,
      roles,
    });
    if (newUser) {
      // Tạo RSA key và token đầu tiên cho user
      const { publicKey, privateKey } = generateKeyPair();
      const keyUser = await createTokenPair(
        { userId: newUser._id, Email },
        publicKey,
        privateKey
      );

      // Lưu key/token vào DB
      await keyTokenService.createKeyToken({
        userId: newUser._id,
        publicKey,
        privateKey,
        refreshToken: keyUser.refreshToken,
      });
      return {
        code: "20000",
        message: "Đăng ký người dùng thành công!",
        metadata: {
          User: getInfoData({
            fields: ["_id", "UserName", "Email"],
            object: newUser,
          }),
          keyUser,
        },
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };

  /**
   * @method Login
   * @description
   *  Xác thực thông tin đăng nhập người dùng.
   *
   *  Mục tiêu:
   *    - Kiểm tra email và mật khẩu.
   *    - Sinh cặp RSA key và token mới, ghi đè key cũ (mỗi login → key mới).
   *    - Trả về thông tin cơ bản của user và token cho client.
   *
   * @param {Object} params
   * @param {String} params.Email - Email đăng nhập
   * @param {String} params.Password - Mật khẩu người dùng
   * @throws {NotFoundError|UnauthorizedError} Nếu email không tồn tại hoặc mật khẩu sai
   * @returns {Object} Cặp token và thông tin người dùng
   */
  static Login = async ({ Email, Password }) => {
    const user = await customerModel
      .findOne({ Email })
      .select("+Password")
      .lean();
    if (!user) {
      throw new NotFoundError("Email không tồn tại!");
    }

    // So sánh mật khẩu
    const matchPassword = await bcrypt.compare(Password, user.Password);
    if (!matchPassword) {
      throw new UnauthorizedError("Mật khẩu không chính xác!");
    }

    // Tạo cặp RSA key mới và token tương ứng
    const { publicKey, privateKey } = generateKeyPair();
    const keyUser = await createTokenPair(
      { userId: user._id, Email },
      publicKey,
      privateKey
    );

    // Lưu key/token vào DB
    await keyTokenService.createKeyToken({
      userId: user._id,
      publicKey,
      privateKey,
      refreshToken: keyUser.refreshToken,
    });
    return {
      code: "20000",
      message: "Đăng nhập thành công!",
      metadata: {
        User: getInfoData({
          fields: ["_id", "UserName", "Email"],
          object: user,
        }),
        keyUser,
      },
    };
  };
}
export default AccessService;
