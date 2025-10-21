import keyTokenModel from "../models/keyToken.model.mjs";
class keyTokenservice {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }) => {
    try {
      const filter = { user: userId },
        update = {
          user: userId,
          publicKey,
          privateKey,
          refreshTokensUsed: [],
          refreshToken,
        },
        options = { upsert: true, new: true };
      const tokens = await keyTokenModel.findOneAndUpdate(
        filter,
        update,
        options
      );
      return tokens ? tokens.publicKey : null;
    } catch (error) {
      return error;
    }
  };

  static updateKeyToken = async ({ _id, tokens, refreshToken }) => {
    const filter = { user: _id, refreshToken },
      update = {
        $set: {
          refreshToken: tokens.refreshToken,
        },
        $addToSet: {
          refreshTokensUsed: refreshToken,
        },
      },
      options = {
        upsert: true, // nếu chưa có thì tạo mới
        new: true, // trả về document mới
      };

    const updated = await keyTokenModel.findOneAndUpdate(
      filter,
      update,
      options
    );
    if (!updated) {
      // 1. Token cũ đã bị rotate (có request khác refresh thành công trước)
      // 2. Hoặc token reuse / bị đánh cắp
      await keyTokenModel.deleteMany({ user: _id });
      throw new UnauthorizedError(
        "Refresh token mismatch / possible reuse. Please login again."
      );
    }
    return updated;
  };
  static deleteKeyById = async (uId) => {
    return await keyTokenModel.deleteMany({ user: uId });
  };
  static findByUserId = async (uId) => {
    return await keyTokenModel.findOne({ user: uId }).lean();
  };
}
export default keyTokenservice;
