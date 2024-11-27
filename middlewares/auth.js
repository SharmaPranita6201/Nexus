const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.redirect("/nexus/login");
  }
  try {
    const decode = jwt.verify(token, "SECRET_KEY");
    req.user = decode;
  } catch (err) {
    console.log(err);
  }

  next();
};

module.exports = auth;
