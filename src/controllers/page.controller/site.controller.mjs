import AccessService from "../../services/access.service.mjs";
import result from "../../auth/authUtils.mjs";
const { setAuthCookies } = result;
import { product } from "../../models/product.model.mjs";
import { NotFoundError } from "../../core/error.response.mjs";
class SiteController {
  // [GET] login
  LoginPage(req, res) {
    res.render("auth", {
      layout: "auth",
      showForm: "login",
      success: req.query.success,
      error: req.query.error,
      next: req.query.next || "/home",
    });
  }

  // [GET] sigup
  SignupPage(req, res) {
    res.render("auth", {
      layout: "auth",
      showForm: "signup",
      success: req.query.success,
      error: req.query.error,
    });
  }

  // [GET] home
  async HomePage(req, res) {
    const Products = await product
      .find({
        isPublish: true,
        isDraft: false,
      })
      .populate("product_shopId", "UserName")
      .lean();
    if (!Products) throw new NotFoundError("No products found");
    res.render("home", {
      layout: "main",
      Products,
    });
  }

  //[POST] signup
  async HandleSignup(req, res) {
    const result = await AccessService.SignUp({ userData: req.body });
    if (result.metadata?.keyUser) {
      setAuthCookies(res, result.metadata.keyUser);
    }
    return res.redirect(
      "/login?success=" +
        encodeURIComponent("Account created successfully, please log in.")
    );
  }

  // [POST] login
  async HandleLogin(req, res) {
    const result = await AccessService.Login(req.body);
    if (!result.metadata) {
      return res.render("auth", {
        layout: "auth",
        showForm: "login",
        error: "Invalid login, please try again.",
        next: req.body.next || req.query.next || "/home",
      });
    }

    if (result.metadata?.keyUser) {
      setAuthCookies(res, result.metadata.keyUser);
    }

    // Lấy next từ body hoặc query
    const redirectUrl = req.body.next || req.query.next || "/home";
    return res.redirect(redirectUrl);
  }

  async HandleLogout(req, res) {
    const result = await AccessService.Logout(req.userId);

    if (!result || result.deletedCount === 0) {
      // lỗi hệ thống (không xoá được token mặc dù user đang login)
      return res.status(500).json({
        message: "Đăng xuất thất bại, vui lòng thử lại",
      });
    }
    return res.render("auth", {
      layout: "auth",
      showForm: "login",
    });
  }
}
const siteController = new SiteController();
export default siteController;
