require("dotenv").config()
const express = require("express");
const app = express();

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const socketIO = require("./serverSocket.js");


socketIO(io);

const mongoose = require("mongoose");
const User = require("./models/userSchema.js");
const Room = require("./models/roomSchema.js");
const ChatMsg = require("./models/msgSchema.js");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const auth = require("./middlewares/auth.js");

// Database connection
main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

let port = process.env.PORT || 3000;
app.set("view engine", "ejs");

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

server.listen(port, (req, res) => {
  console.log(`Server is running on port: 3000`);
});

app.get("/nexus/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/nexus/signup", async (req, res) => {
  let { userData } = req.body;
  if (userData.password !== userData.confirmPass) {
    console.log("Password do not Match");
    res.redirect("/nexus/signup");
  } else {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log("User already exists");
      res.redirect("/nexus/signup");
    } else {
      const encPass = await bcrypt.hash(userData.password, 10);
      userData.password = encPass;

      let newUser = await new User(userData);

      await newUser.save();
      res.redirect("/nexus/login");
    }
  }
});

app.get("/nexus/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/nexus/login", async (req, res) => {
  const { userData } = req.body;

  const existingUser = await User.findOne({ username: userData.username });

  if (!existingUser) {
    console.log("User does not exist");
    return res.redirect("/nexus/login");
  }

  const encPassCmp = await bcrypt.compare(
    userData.password,
    existingUser.password
  );

  if (encPassCmp) {
    const token = jwt.sign(
      {
        username: existingUser.username,
        email: existingUser.email,
      },
      "SECRET_KEY",
      { expiresIn: "2h" }
    );

    existingUser.token = token;

    const option = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 1000),
      httpOnly: true,
    };

    res.cookie("token", token, option);
    res.redirect("/nexus/userDashboard");
  } else {
    console.log("Wrong Password");
    res.redirect("/nexus/login");
  }
});

app.get("/nexus/UserDashboard", auth, async (req, res) => {
  const { existingUser } = await findUser(req.user);
  if (existingUser.role === "admin") {
    res.redirect("/nexus/adminCreate");
  } else {
    res.redirect("/nexus/memberJoin");
  }
});

app.get("/nexus/adminCreate", auth, async (req, res) => {
  const { existingUser } = await findUser(req.user);
  const { roomsList } = await findRoomList(existingUser._id);

  res.render("adminCreate.ejs", { existingUser, roomsList });
});

app.post("/nexus/adminCreate", auth, async (req, res) => {
  const { existingUser } = await findUser(req.user);
  const { roomName } = req.body;
  const roomCode = Math.random().toString(36).substring(2, 10);

  const newRoom = new Room({
    room: roomName,
    code: roomCode,
    created_by: existingUser._id,
  });

  await newRoom.save();

  res.redirect(`/nexus/privateRoom/${roomCode}`);
});

app.get("/nexus/memberJoin", auth, async (req, res) => {
  const { existingUser } = await findUser(req.user);
  res.render("memberJoin.ejs", { existingUser });
});

app.post("/nexus/memberJoin", auth, async (req, res) => {
  const { existingCode } = await findRoom(req.body);
  if (existingCode) {
    res.redirect(`/nexus/privateRoom/${existingCode.code}`);
  } else {
    res.send("not found");
  }
});

app.get("/nexus/privateRoom/:roomCode", auth, async (req, res) => {
  const { existingUser } = await findUser(req.user);
  const { roomCode } = req.params;
  const existingRoom = await Room.findOne({ code: roomCode });
  res.render("chatRoom.ejs", { existingUser, existingRoom });
});

app.get("/nexus/manageRoom/:roomCode", auth, async (req, res) => {
  const existingRoom = await Room.findOne({ code: req.params.roomCode });
  // console.log(existingRoom);
  res.render("manageRoom.ejs", { existingRoom });
});

app.get("/nexus/manageRoom/:roomId/editRoom", auth, async (req, res) => {
  const existingRoom = await Room.findOne({ _id: req.params.roomId });
  // console.log(existingRoom);
  res.render("editRoom.ejs", { existingRoom });
});

app.put("/nexus/manageRoom/:roomId", auth, async (req, res) => {
  let { room, code } = req.body;
  let newEdit = await Room.findByIdAndUpdate(
    { _id: req.params.roomId },
    { room, code }
  );

  await newEdit.save();
  res.redirect("/nexus/adminCreate");
});

app.delete("/nexus/manageRoom/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  const { code } = await Room.findOne({ _id: roomId });

  await ChatMsg.deleteMany({ code });

  await Room.findByIdAndDelete({ _id: roomId });
  res.redirect("/nexus/adminCreate");
});

const findUser = async (userData) => {
  const showUser = userData;
  const existingUser = await User.findOne({ username: showUser.username });
  return { existingUser };
};

const findRoomList = async (userId) => {
  const showUser = userId;
  // console.log(userId);
  const roomsList = await Room.find({ created_by: showUser._id });
  return { roomsList };
};

const findRoom = async (userCode) => {
  const { inputCode } = userCode;
  const existingCode = await Room.findOne({ code: inputCode });
  return { existingCode };
};

// const findChatMsg = async (roomCode) => {
//   const { inputCode } = roomCode;
//   const existingCode = await ChatMsg.find({ code: inputCode });
//   return { existingCode };
// };

app.get("/nexus", (req, res) => {
  res.render("home.ejs");
});

//ask for permit to join from admin
