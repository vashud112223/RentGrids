const validator = require("validator");
const ValidateUser = (req) => {
  const { fullName, emailId, password,phonenumber } = req.body;
  if (!fullName) {
    throw new Error(" Full Name required");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Enter a strong password");
  }
    else if (!validator.isMobilePhone(phonenumber, "en-IN")) {
  throw new Error("Enter a valid phone number");
}

};

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) return res.status(400).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
};

module.exports= { ValidateUser,authMiddleware};
