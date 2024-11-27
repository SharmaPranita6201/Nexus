const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
