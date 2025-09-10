class SiteController {
  // [GET] /
  LoginPage(req, res) {
    res.render("auth", { layout: "auth" });
  }
}
const siteController = new SiteController();
export default siteController;
