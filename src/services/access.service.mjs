import customerModel from "../models/customer.model.mjs";
import authUtils from "../auth/authUtils.mjs";
import bcrypt from "bcrypt";
import { getInfoData } from "../utils/index.mjs";
import keyTokenService from "./keyToken.service.mjs";
import { NotFoundError } from "../core/error.response.mjs";

import { generateKeyPair } from "../utils/index.mjs";
const { HEADER, createTokenPair } = authUtils;

class AccessService {
  static handleRefreshToken = async ({
    _id,
    Email,
    refreshToken,
    keyCustomers,
  }) => {
    if (keyCustomers.refreshTokensUsed.includes(refreshToken)) {
      await keyTokenService.deleteKeyById(userId);
      throw new Error("Something wrong happen. Pls re-login");
    }
    if (refreshToken !== keyCustomers.refreshToken) {
      throw new NotFoundError("Refresh Token not valid");
    }
    const foundUserEmail = await customerModel.findOne({ Email }).lean();
    if (!foundUserEmail)
      throw new NotFoundError("User not registered in system");

    const userId = _id;
    const tokens = await createTokenPair(
      { userId, Email },
      keyCustomers.publicKey,
      keyCustomers.privateKey
    );

    await keyTokenService.updateKeyToken({ _id, tokens, refreshToken });
    return {
      code: 200,
      message: "Get new Tokens successfully",
      metadata: {
        tokens,
      },
    };
  };
  static Logout = async (userId) => {
    const deKey = await keyTokenService.deleteKeyById(userId);
    return deKey;
  };
  static SignUp = async ({ userData }) => {
    try {
      const { UserName, Phone, Email, Password, Address, roles } = userData;
      const userEmail = await customerModel.findOne({ Email }).lean();
      if (userEmail) {
        throw new Error("Email already registered!");
      }
      const passwordHash = await bcrypt.hash(Password, 10);
      const newUser = await customerModel.create({
        UserName,
        Phone,
        Email,
        Password: passwordHash,
        Address,
        roles,
      });
      if (newUser) {
        const { publicKey, privateKey } = generateKeyPair();
        const keyUser = await createTokenPair(
          { userId: newUser._id, Email },
          publicKey,
          privateKey
        );
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
            }), // Lọc thông tin người dùng để trả về
            keyUser, // Trả về cặp token
          },
        };
      }
      return {
        // Trả về nếu không tạo được tài khoản
        code: 200,
        metadata: null,
      };
    } catch (error) {
      return { code: 50000, message: error.message };
    }
  };

  static Login = async ({ Email, Password }) => {
    try {
      const user = await customerModel
        .findOne({ Email })
        .select("+Password")
        .lean();
      if (!user) {
        throw new Error("Email không tồn tại!");
      }

      const matchPassword = await bcrypt.compare(Password, user.Password);
      if (!matchPassword) {
        throw new Error("Mật khẩu không chính xác!");
      }

      const { publicKey, privateKey } = generateKeyPair();
      const keyUser = await createTokenPair(
        { userId: user._id, Email },
        publicKey,
        privateKey
      );
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
          }), // Lọc thông tin người dùng để trả về
          keyUser, // Trả về cặp token
        },
      };
    } catch (error) {
      return { code: 50000, message: error.message };
    }
  };
}
export default AccessService;
