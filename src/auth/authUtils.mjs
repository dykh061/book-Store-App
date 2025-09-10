import JWT from "jsonwebtoken";
import asyncHandler from "../helpers/asyncHandler.helper.mjs";
import customerModel from "../models/customer.model.mjs";
import { NotFoundError, UnauthorizedError } from "../core/error.response.mjs";
import AccessService from "../services/access.service.mjs";
import { setCookie } from "../utils/index.mjs";
import keyTokenservice from "../services/keyToken.service.mjs";

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
  CLIENT_ID: "x-client-id",
  REFRESHTOKEN: "x-rtoken-id",
};

const handleRefreshToken = asyncHandler(async (req, res, next) => {
  if (!req.accessTokenExpired) {
    return next();
  }

  const { keyCustomers, decoded } = req;
  const refreshToken =
    req.cookies[HEADER.REFRESHTOKEN] || req.headers[HEADER.REFRESHTOKEN];

  if (!refreshToken) {
    const e = new UnauthorizedError("No Refresh Token");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }

  let decodedRefresh;
  try {
    decodedRefresh = await verifyToken(refreshToken, keyCustomers.publicKey);
  } catch {
    const e = new UnauthorizedError("Invalid Refresh Token");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }
  const result = await AccessService.handleRefreshToken({
    _id: decodedRefresh.userId,
    Email: decodedRefresh.Email,
    refreshToken: refreshToken,
    keyCustomers: keyCustomers,
  });
  setAuthCookies(res, result.metadata.tokens);
  req.userId = decodedRefresh.userId;
  req.user = await customerModel.findById(decodedRefresh.userId).lean();
  req.keyCustomers = result.metadata.newKey;
  req.decoded = decodedRefresh;
  return next();
});

// kiểm tra access Token có hợp lệ không
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
  const keyCustomers = await keyTokenservice.findByUserId(decode.userId);
  if (!keyCustomers) {
    const e = new NotFoundError("Key Not Found For User");
    e.action = "LOGIN_REQUIRED";
    e.redirectTo = req.originalUrl;
    throw e;
  }
  try {
    const verify = await verifyToken(accessToken, keyCustomers.publicKey);
    req.userId = verify.userId;
    req.keyCustomers = keyCustomers;
    req.user = await customerModel.findById(verify.userId).lean();
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
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
  handleRefreshToken,
  setAuthCookies,
  authentication,
  createTokenPair,
  verifyToken,
  authorize,
};
export default result;
