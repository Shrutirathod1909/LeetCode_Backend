const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');        // MongoDB connection
const cookieParser = require('cookie-parser');
const cors = require('cors');
const redisClient = require('./config/redis');

// Routers
const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");
app.set("trust proxy", 1)
// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);


// Test route
app.get("/apitesting", (req, res) => {
    res.send("Backend running 🚀");
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

// Initialize DB & Redis and start server
const InitializeConnection = async () => {
  try {
    await main();
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log("Server listening on port " + PORT)
    );
  } catch (err) {
    console.error("Initialization Error:", err);
  }
};

InitializeConnection();