/**
 * @module utils/authen.utils
 * @description
 * Middleware và hàm tiện ích phục vụ xác thực (Authentication) và phân quyền (Authorization) người dùng.
 *
 * Chức năng chính:
 * - Xác thực người dùng thông qua Access Token (JWT, RSA-2048).
 * - Làm mới Access Token khi hết hạn bằng Refresh Token.
 * - Phân quyền truy cập theo role.
 * - Hỗ trợ tạo token, verify token và thiết lập cookie bảo mật.
 *
 * Dùng kết hợp với:
 * - `AccessService` (xử lý logic refresh token)
 * - `keyTokenService` (truy vấn và lưu trữ khóa RSA)
 * - `customerModel` (truy xuất thông tin người dùng)
 */

import JWT from "jsonwebtoken";
import asyncHandler from "../helpers/asyncHandler.helper.mjs";
import customerModel from "../models/customer.model.mjs";
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "../core/error.response.mjs";
import AccessService from "../services/access.service.mjs";
import { setCookie } from "../utils/index.mjs";
import keyTokenservice from "../services/keyToken.service.mjs";

/**
 * @constant HEADER
 * @description
 * Bộ hằng số chuẩn hóa key trong header/cookie để tránh lỗi chính tả hoặc thiếu đồng nhất.
 */
const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization", // Access token
  CLIENT_ID: "x-client-id",
  REFRESHTOKEN: "x-rtoken-id", // Refresh token
};

/**
 * @middleware handleRefreshToken
 * @description
 * Middleware tự động xử lý **làm mới Access Token** khi token cũ đã hết hạn.
 *
 * Quy trình:
 * 1. Nếu Access Token còn hạn → cho phép next().
 * 2. Nếu hết hạn → kiểm tra Refresh Token (từ cookie hoặc header).
 * 3. Verify Refresh Token bằng publicKey trong DB.
 * 4. Nếu hợp lệ → gọi `AccessService.handleRefreshToken()` để tạo token mới.
 * 5. Ghi lại cookie mới, cập nhật `req.user` và tiếp tục request.
 *
 * @throws {UnauthorizedError} Nếu không có Refresh Token hoặc token sai
 */
const handleRefreshToken = asyncHandler(async (req, res, next) => {
  if (!req.accessTokenExpired) {
    return next();
  }

  const { keyCustomers, decoded } = req;
  const refreshToken =
    req.cookies[HEADER.REFRESHTOKEN] || req.headers[HEADER.REFRESHTOKEN];

  if (!refreshToken) {
    // ⚠️ Không có refresh token → yêu cầu đăng nhập lại
    res.clearCookie(HEADER.AUTHORIZATION);
    res.clearCookie(HEADER.REFRESHTOKEN);
    const e = new UnauthorizedError("No Refresh Token");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }

  // Verify refresh token
  let decodedRefresh;
  try {
    decodedRefresh = await verifyToken(refreshToken, keyCustomers.publicKey);
  } catch {
    res.clearCookie(HEADER.AUTHORIZATION);
    res.clearCookie(HEADER.REFRESHTOKEN);
    const e = new UnauthorizedError("Invalid Refresh Token");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }

  // ✅ Token hợp lệ → cấp token mới
  const result = await AccessService.handleRefreshToken({
    _id: decodedRefresh.userId,
    Email: decodedRefresh.Email,
    refreshToken: refreshToken,
    keyCustomers: keyCustomers,
  });

  // Cập nhật cookie và request context
  setAuthCookies(res, result.metadata.tokens);
  req.userId = decodedRefresh.userId;
  req.user = await customerModel.findById(decodedRefresh.userId).lean();
  req.keyCustomers = result.metadata.newKey;
  req.decoded = decodedRefresh;
  return next();
});

/**
 * @middleware authentication
 * @description
 * Middleware xác thực người dùng bằng Access Token.
 *
 * Quy trình:
 * 1. Lấy Access Token từ cookie hoặc header Authorization.
 * 2. Decode JWT để lấy `userId`.
 * 3. Truy vấn khóa RSA tương ứng từ DB.
 * 4. Verify chữ ký token.
 * 5. Nếu hết hạn → gắn cờ `req.accessTokenExpired` cho middleware refresh xử lý.
 *
 * @throws {UnauthorizedError} Nếu token thiếu, sai hoặc hết hạn
 * @throws {NotFoundError} Nếu không tìm thấy khóa RSA của user
 */

const authentication = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies[HEADER.AUTHORIZATION] ||
    req.headers[HEADER.AUTHORIZATION]?.split(" ")[1];
  if (!accessToken) {
    const e = new UnauthorizedError("No Access Token");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }

  // Decode trước (chưa verify) để lấy userId
  let decode;
  try {
    decode = JWT.decode(accessToken);
  } catch {
    const e = new UnauthorizedError("Invalid Access Token");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }
  if (!decode?.userId) {
    const e = new UnauthorizedError("Access Token Invalid");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }

  // Lấy khóa RSA theo userId
  const keyCustomers = await keyTokenservice.findByUserId(decode.userId);
  if (!keyCustomers) {
    const e = new NotFoundError("Key Not Found For User");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }

  // Verify chữ ký token
  try {
    const verify = await verifyToken(accessToken, keyCustomers.publicKey);
    req.userId = verify.userId;
    req.keyCustomers = keyCustomers;
    req.user = await customerModel.findById(verify.userId).lean();
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // ⚠️ Token hết hạn → chuyển cho middleware handleRefreshToken
      req.accessTokenExpired = true;
      req.keyCustomers = keyCustomers;
      req.decoded = decode;
      return next();
    }
    const e = new UnauthorizedError("Access Token Invalid");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }
});

/**
 * @middleware authorize
 * @description
 * Middleware kiểm tra quyền truy cập của người dùng dựa trên role.
 *
 * @param {string[]|string} roles - Danh sách role được phép truy cập.
 * @throws {ForbiddenError} Nếu người dùng không có quyền hoặc không có role.
 */
const authorize = (roles = []) => {
  if (!Array.isArray(roles)) {
    roles = [roles]; // nếu chỉ truyền string thì ép vào array
  }
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user) throw new ForbiddenError("Invalid Request");

    if (!user.roles) throw new ForbiddenError("User has no roles assigned");

    const hasRole = roles.some((role) => user.roles.includes(role));
    if (!hasRole)
      throw new ForbiddenError(
        "You are not authorized to access this resource"
      );
    return next();
  });
};

/**
 * @function createTokenPair
 * @description
 * Sinh cặp Access Token & Refresh Token sử dụng RSA-2048.
 *
 * @param {Object} payload - Dữ liệu user để mã hoá vào token
 * @param {string} publicKey - Khóa công khai
 * @param {string} privateKey - Khóa bí mật
 * @returns {{accessToken: string, refreshToken: string}}
 */
const createTokenPair = async (payload, publicKey, privateKey) => {
  const accessToken = JWT.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "30m",
  });
  const refreshToken = JWT.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
  });
  // Kiểm tra token có hợp lệ (optional)
  try {
    const decode = await verifyToken(accessToken, publicKey);
  } catch (err) {
    console.error("Error verify access token: ", err);
  }
  return { accessToken, refreshToken };
};

/**
 * @function verifyToken
 * @description
 * Verify chữ ký JWT token bằng publicKey.
 *
 * @param {string} token - JWT token cần kiểm tra
 * @param {string} key - Public key để verify
 * @returns {Promise<Object>} Thông tin giải mã (decode)
 */
const verifyToken = (token, key) => {
  return new Promise((resolve, reject) => {
    JWT.verify(
      token,
      key,
      {
        algorithms: ["RS256"],
      },
      (err, decode) => {
        if (err) reject(err);
        else resolve(decode);
      }
    );
  });
};

/**
 * @function setAuthCookies
 * @description
 * Thiết lập cookie bảo mật chứa Access Token và Refresh Token.
 *
 * - Tự động thêm các option: `httpOnly`, `secure`, `sameSite: strict`.
 * - Thời hạn Access Token: 30 phút.
 * - Thời hạn Refresh Token: 7 ngày.
 */
const setAuthCookies = (res, keyUser) => {
  setCookie(res, HEADER.AUTHORIZATION, keyUser.accessToken, {
    maxAge: 30 * 60 * 1000, // 30 phút
  });
  setCookie(res, HEADER.REFRESHTOKEN, keyUser.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
};

const result = {
  HEADER,
  handleRefreshToken,
  setAuthCookies,
  authentication,
  createTokenPair,
  verifyToken,
  authorize,
};
export default result;
