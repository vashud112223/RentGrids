const validator = require("validator");
const ValidateUser = (req) => {
  const { fullname, emailId, password } = req.body;
  if (!firstName || !lastName) {
    throw new Error("Name required");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not vald");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Enter a strong password");
  }
    else if (!validator.isStrongPassword(password)) {
    throw new Error("Enter a strong password");
  }
};

const validateProfileData = (req)=> {
  const Allowed_Fields = [
    "firstName",
    "lastName",
    "age",
    "gender",
    "about",
    "skills",
    "photoURL"
  ];
  const isAllowed = Object.keys(req.body).every((field) => Allowed_Fields.includes(field));
  return isAllowed;
}

module.exports= { ValidateUser,validateProfileData };
