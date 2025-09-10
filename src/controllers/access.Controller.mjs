import AccessService from "../services/access.service.mjs";
import { CreatedResponse, OkResponse } from "../core/success.response.mjs";
import { setCookie } from "../utils/index.mjs";
import result from "../auth/authUtils.mjs";
const { HEADER, setAuthCookies } = result;

class AccessController {
  SignUp = async (req, res, next) => {
    const result = await AccessService.SignUp({ userData: req.body });
    if (result.metadata.keyUser) {
      setAuthCookies(res, result.metadata.keyUser);
    }

    new CreatedResponse({
      message: "User created successfully",
      metaData: result.metadata,
    }).send(res);
  };
  Login = async (req, res, next) => {
    const result = await AccessService.Login(req.body);
    if (result.metadata == null || result.metadata == undefined) {
      return res.status(500).json({
        code: 50000,
        message: "Metadata is null or undefined",
      });
    }
    if (result.metadata.keyUser) {
      setAuthCookies(res, result.metadata.keyUser);
    }

    new OkResponse({
      message: "Login account successfully",
      metaData: result.metadata,
    }).send(res);
  };
  ResetToken = async (req, res, next) => {
    const result = await AccessService.handleRefreshToken({
      _id: req.user._id,
      Email: req.user.Email,
      refreshToken:
        req.cookies[HEADER.REFRESHTOKEN] || req.headers[HEADER.REFRESHTOKEN],
      keyCustomers: req.keyCustomers,
    });
    if (result.metadata.tokens) {
      setAuthCookies(res, result.metadata.tokens);
    }
    new OkResponse({
      message: "Get new token successfully",
      metaData: result.metadata,
    }).send(res);
  };
  Logout = async (req, res, next) => {
    const metaData = await AccessService.Logout(req.userId);
    res.clearCookie(HEADER.REFRESHTOKEN);
    res.clearCookie(HEADER.AUTHORIZATION);
    new OkResponse({
      message: "Logout account successfully",
      metaData: metaData,
    }).send(res);
  };
}
export default new AccessController();
