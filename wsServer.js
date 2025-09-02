const ws = require("ws");
const jwt = require("jsonwebtoken");
const Message = require("./models/messageModel");
const { User } = require("./models/userModel");

function createWebSocketServer(httpServer) {
  const wss = new ws.WebSocketServer({ server: httpServer });

  // Helper to notify all clients about online users
  const notifyAboutOnlinePeople = async () => {
    try {
      const onlineUsers = await Promise.all(
        Array.from(wss.clients).map(async (client) => {
          const { userId, username } = client;
          const user = await User.findById(userId);
          const avatarLink = user ? user.avatarLink : null;
          return { userId, username, avatarLink };
        })
      );

      wss.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            online: onlineUsers,
          })
        );
      });
    } catch (err) {
      console.error("Error notifying online users:", err);
    }
  };

  wss.on("connection", (connection, req) => {
    console.log("🔗 New client connected");

    connection.isAlive = true;

    // Heartbeat to check if client is alive
    const heartbeat = setInterval(() => {
      if (!connection.isAlive) {
        clearInterval(heartbeat);
        connection.terminate();
        notifyAboutOnlinePeople();
        console.log("❌ Dead connection removed");
        return;
      }
      connection.isAlive = false;
      connection.ping();
    }, 5000);

    connection.on("pong", () => {
      connection.isAlive = true;
    });

    // Extract auth token from cookies
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenString = cookies
        .split(";")
        .find((str) => str.trim().startsWith("authToken="));
      if (tokenString) {
        const token = tokenString.split("=")[1];
        jwt.verify(token, process.env.JWTPRIVATEKEY, {}, (err, userData) => {
          if (err) return console.error("JWT error:", err);
          connection.userId = userData._id;
          connection.username = `${userData.firstName} ${userData.lastName}`;
        });
      }
    }

    // Handle incoming messages
    connection.on("message", async (message) => {
      try {
        const messageData = JSON.parse(message.toString());
        const { recipient, text } = messageData;

        if (!recipient || !text) return;

        const msgDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        });

        // Send message to recipient
        wss.clients.forEach((client) => {
          if (client.userId === recipient) {
            client.send(
              JSON.stringify({
                sender: connection.username,
                text,
                id: msgDoc._id,
              })
            );
          }
        });
      } catch (err) {
        console.error("Message error:", err);
      }
    });

    // Notify all clients about online users
    notifyAboutOnlinePeople();
  });
}

module.exports = createWebSocketServer;
