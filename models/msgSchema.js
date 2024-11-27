const mongoose = require("mongoose");

const msgSchema = new mongoose.Schema({
  code: { type: String, required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatMsg = mongoose.model("ChatMsg", msgSchema);

module.exports = ChatMsg;
