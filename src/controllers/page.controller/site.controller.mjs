import AccessService from "../../services/access.service.mjs";
import result from "../../auth/authUtils.mjs";
const { setAuthCookies } = result;

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
  HomePage(req, res) {
    res.render("home", {
      layout: "main",
    });
  }

  //[POST] sigup
  async HandleSignup(req, res) {
    const result = await AccessService.SignUp({ userData: req.body });
    if (result.metadata.keyUser) {
      setAuthCookies(res, result.metadata.keyUser);
    }
    return res.redirect(
      "/login?success=" +
        encodeURIComponent("Account created successfully, please log in.")
    );
  }

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

    if (result.metadata.keyUser) {
      setAuthCookies(res, result.metadata.keyUser);
    }

    // Lấy next từ body hoặc query
    const redirectUrl = req.body.next || req.query.next || "/home";
    return res.redirect(redirectUrl);
  }
}
const siteController = new SiteController();
export default siteController;
