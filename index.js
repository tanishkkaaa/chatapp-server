require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const connection = require("./db/db.js");
const userRoute = require("./routes/userRoute.js");
const avatarRoute = require("./routes/avatarRoute.js");
const cookieParser = require("cookie-parser");
const createWebSocketServer = require("./wsServer.js");
const path = require("path");
//database connection
connection();
app.use(express.json());
app.use(cookieParser());
//middlewares
const allowedOrigins = [
"http://localhost:5173",
"http://localhost:4000",
"https://swifty-chatty-appy.onrender.com"
].filter(Boolean); // Filter out any undefined or empty strings

const corsOptions = {
    origin: (origin, callback) => {
if (allowedOrigins.includes(origin) || !origin) {
return callback(null, true);
} else {
callback(new Error("Not allowed by CORS"));
}
},
methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
optionsSuccessStatus: 204,
credentials: true, // Allow credentials like cookies
};
app.use(cors(corsOptions));
app.set("trust proxy", 1); // trust first proxy
app.use("/api/user", userRoute);
app.use("/api/avatar", avatarRoute);
const port = process.env.PORT || 4000;
const server = app.listen(port, () => console.log(`Application Running on Port ${port}`));
createWebSocketServer(server);
const distPath = path.join(__dirname,"..", "..", "frontend", "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error loading page');
    }
  });
});
