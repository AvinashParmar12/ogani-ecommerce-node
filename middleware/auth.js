function isAuth(req, res, next) {
  if (req.session.user) {
    next(); // user is logged in → go to next route
  } else {
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.redirect("/login");
  }
}
module.exports = isAuth;
