import JWT from "jsonwebtoken";
import asyncHandler from "../helpers/asyncHandler.helper.mjs";
import keyTokenModel from "../models/keyToken.model.mjs";
import customerModel from "../models/customer.model.mjs";
import {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} from "../core/error.response.mjs";
import AccessService from "../services/access.service.mjs";
import { setCookie } from "../utils/index.mjs";

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
  CLIENT_ID: "x-client-id",
  REFRESHTOKEN: "x-rtoken-id",
};

// kiểm tra access Token có hợp lệ không
const authentication = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies[HEADER.AUTHORIZATION] ||
    req.headers[HEADER.AUTHORIZATION]?.split(" ")[1];
  if (!accessToken) {
    const refreshToken =
      req.cookies[HEADER.REFRESHTOKEN] || req.headers[HEADER.REFRESHTOKEN];
    if (refreshToken) {
      const result = await AccessService.handleRefreshToken({
        _id: req.userId,
        Email: req.user.Email,
        refreshToken,
        keyCustomers: req.keyCustomers,
      });
      if (result.metadata.tokens) {
        setCookie(
          res,
          HEADER.AUTHORIZATION,
          result.metadata.tokens.accessToken,
          { maxAge: 30 * 60 * 1000 }
        );
        setCookie(
          res,
          HEADER.REFRESHTOKEN,
          result.metadata.tokens.refreshToken,
          { maxAge: 7 * 24 * 60 * 60 * 1000 }
        );
        return next();
      }
      throw new UnauthorizedError("Refresh Token Failed. Please login again.");
    }
    throw new UnauthorizedError(
      "Access Token and Refresh Token not found. Please login."
    );
  }
  const publicKey = req.keyCustomers.publicKey;
  if (!publicKey) throw new NotFoundError("Invalid Request");

  try {
    const verify = await verifyToken(accessToken, publicKey);
    if (!verify) throw new NotFoundError("Invalid Request");
    if (req.userId !== verify.userId)
      throw new InternalServerError("UserId not match");
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const refreshToken =
        req.cookies[HEADER.REFRESHTOKEN] || req.headers[HEADER.REFRESHTOKEN];
      const result = await AccessService.handleRefreshToken({
        _id: req.userId,
        Email: req.user.Email,
        refreshToken,
        keyCustomers: req.keyCustomers,
      });
      if (result.metadata.tokens) {
        setCookie(
          res,
          HEADER.AUTHORIZATION,
          result.metadata.tokens.accessToken,
          {
            maxAge: 30 * 60 * 1000, // 30 phút
          }
        );
        setCookie(
          res,
          HEADER.REFRESHTOKEN,
          result.metadata.tokens.refreshToken,
          {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
          }
        );
        next();
      }
      throw new UnauthorizedError("Refresh Token Failed. Please Login again.");
    }
    throw new InternalServerError("Invalid Access Token");
  }
});

// Kiểm tra roles có đủ quyền hay không truy cập tài nguyên
const authorize = (roles = []) => {
  if (!Array.isArray(roles)) {
    roles = [roles]; // nếu chỉ truyền string thì ép vào array
  }
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user) throw new Error("Invalid Request");
    if (!user.roles) throw new Error("User has no roles assigned");

    const hasRole = roles.some((role) => user.roles.includes(role));
    if (!hasRole)
      throw new Error("You are not authorized to access this resource");
    return next();
  });
};

// Middleware xác thực user đã đăng nhập
const preAuthentication = asyncHandler(async (req, res, next) => {
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new Error("Invalid Request");

  const user = await customerModel.findById(userId).lean();
  if (!user) throw new Error("User not registered in system");

  const keyCustomers = await keyTokenModel.findOne({ user: userId });
  if (!keyCustomers) throw new Error("Invalid Request");

  req.keyCustomers = keyCustomers;
  req.userId = userId;
  req.user = user;
  return next();
});

// Tạo cặp accessToken và refreshToken
const createTokenPair = async (payload, publicKey, privateKey) => {
  const accessToken = JWT.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "30m",
  });
  const refreshToken = JWT.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
  });
  try {
    const decode = await verifyToken(accessToken, publicKey);
    console.log("Decode Access Token: ", decode);
  } catch (err) {
    console.error("Error verify access token: ", err);
  }
  return { accessToken, refreshToken };
};

// Xác thực token
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

const setAuthCookies = (res, keyUser) => {
  setCookie(res, HEADER.AUTHORIZATION, keyUser.accessToken, {
    maxAge: 30 * 60 * 1000,
  });
  setCookie(res, HEADER.REFRESHTOKEN, keyUser.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const result = {
  HEADER,
  setAuthCookies,
  authentication,
  createTokenPair,
  verifyToken,
  preAuthentication,
  authorize,
};
export default result;
