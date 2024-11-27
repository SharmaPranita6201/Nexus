const socket = io();

const form = document.querySelector("#chat-form");
const input = document.querySelector("#msg");
const message = document.querySelector(".chat-messages");
const roomName = "<%= existingRoom.room %>";
const roomCode = "<%= existingRoom.code %>";
const username = "<%= existingUser.username %>";
const userList = document.querySelector("#users");
// const leaveBtn = document.querySelector("#leaveBtn");

socket.emit("joinRoom", { username, roomCode, roomName });

socket.on("updateUserList", (users) => {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
});

socket.on("notify", (msg) => {
  castMsg(msg);
  message.scrollTop = message.scrollHeight;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chatMsg", { msg: input.value, username, roomCode });
    input.value = "";
  }
});

// leaveBtn.addEventListener("click", () => {
//   socket.emit("leaveRoom", roomCode);
// });

socket.on("chatMsg", (msg) => {
  castMsg(msg);
  message.scrollTop = message.scrollHeight;
});

function castMsg(msg) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${msg.username}<span>${msg.time}</span></p>
<p class="text">${msg.text}</p>`;
  message.appendChild(div);
  console.log(msg.username, msg.text, msg.time);
}