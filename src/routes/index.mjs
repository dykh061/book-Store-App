export default function router(app) {
  app.get("/", (req, res) => {
    res.render("home");
  });
}
