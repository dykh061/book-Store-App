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
    const filter = { user: _id },
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

    return await keyTokenModel.updateOne(filter, update, options);
  };
  static deleteKeyById = async (uId) => {
    return await keyTokenModel.deleteMany({ user: uId });
  };
  static findByUserId = async (uId) => {
    return await keyTokenModel.findOne({ user: uId }).lean();
  };
}
export default keyTokenservice;
