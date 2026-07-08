import jwt from "jsonwebtoken";

const generateToken = (id, role, username) => {

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not defined in environment variables"
    );
  }

  return jwt.sign(
    {
      id,
      role,
      username
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "1d"
    }
  );

};

export default generateToken;