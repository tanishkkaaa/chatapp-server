const jwt = require("jsonwebtoken");
async function protect(req) {
return new Promise((resolve, reject) => {
const token = req.cookies?.authToken;
if (token) {
jwt.verify(token, process.env.JWTPRIVATEKEY, {}, (err, user)=>{
if (err) {
reject(err);
} else {
resolve(user);
}
});
} else {
reject("no token");
}
});
}
module.exports = protect;