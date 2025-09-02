const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const userSchema = new mongoose.Schema(
{
firstName: { type: String, required: true },
lastName: { type: String, required: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
verified: { type: Boolean, default: false },
verificationLinkSent: { type: Boolean, default: false },
avatarLink: { type: String },
},
{ timestamps: true }
);
userSchema.methods.generateAuthToken = function () {
     if (!process.env.JWTPRIVATEKEY) {
    throw new Error("FATAL ERROR: JWTPRIVATEKEY is not defined.");
  }
const token = jwt.sign(
{
_id: this._id,
firstName: this.firstName,
lastName: this.lastName,
email: this.email,
},
process.env.JWTPRIVATEKEY,
{ expiresIn: "7d" }
);
return token;
};
const User = mongoose.model("User", userSchema);
const validateRegister = (data) => {
const schema = Joi.object({
firstName: Joi.string().required().label("First Name"),
lastName: Joi.string().required().label("Last Name"),
email: Joi.string().email().required().label("Email"),
password: passwordComplexity().required().label("Password"),
});
return schema.validate(data);
};
const validateLogin = (data) => {
const schema = Joi.object({
email: Joi.string().email().required().label("Email"),
password: Joi.string().required().label("Password"),
});
return schema.validate(data);
};
module.exports = { User, validateRegister, validateLogin };