document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const roomId = window.location.pathname.split("/").pop();
  const messagesEl = document.getElementById("messages");
  const memberListEl = document.getElementById("member-list");
  const inputEl = document.getElementById("message-input");
  const leaveBtn = document.getElementById("leaveRoomBtn");

  let userId = null;

  const socket = io({ auth: { token } });

  socket.on("connect", () => {
    console.log("Connected to server");
  });

  socket.on("connected", (data) => {
    userId = data.user_id;
    socket.emit("join_room", { room_id: roomId, user_id: userId });
  });

  socket.on("message_history", (messages) => {
    messagesEl.innerHTML = "";
    messages.forEach((msg) =>
      appendMessage(msg.username, msg.content, msg.timestamp)
    );
  });

  socket.on("new_message", (msg) => {
    appendMessage(
      msg.username,
      msg.content,
      msg.timestamp,
      msg.system || false
    );
  });

  socket.on("user_joined", (data) => {
    appendMessage("System", `${data.username} joined the chat`, "", true);
    loadMembers();
  });

  socket.on("user_left", (data) => {
    appendMessage("System", `${data.username} left the chat`, "", true);
    loadMembers();
  });

  socket.on("kicked", () => {
    alert("You were removed from the room");
    window.location.href = "/api/rooms/dashboard";
  });

  socket.on("blocked", () => {
    alert("You were blocked from this room");
    window.location.href = "/api/rooms/dashboard";
  });

  socket.on("room_deleted", () => {
    alert("Room deleted by owner");
    window.location.href = "/api/rooms/dashboard";
  });

  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const content = inputEl.value.trim();
      if (content) {
        socket.emit("send_message", {
          room_id: roomId,
          user_id: userId,
          content,
        });
        inputEl.value = "";
      }
    }
  });

  const sendBtn = document.getElementById("sendBtn");
  sendBtn.addEventListener("click", () => {
    const content = inputEl.value.trim();
    if (content) {
      socket.emit("send_message", {
        room_id: roomId,
        user_id: userId,
        content,
      });
      inputEl.value = "";
    }
  });

  leaveBtn.addEventListener("click", () => {
    socket.emit("leave_room", { room_id: roomId, user_id: userId });
    window.location.href = "/api/rooms/dashboard";
  });

  function appendMessage(username, content, timestamp, isSystem = false) {
    const div = document.createElement("div");

    if (isSystem) {
      // System message (centered)
      div.className = "system-msg";
      div.textContent = content;
    } else {
      // Chat message
      div.className = "message";

      // Optional: different color if self message
      if (username === "You") {
        div.classList.add("self");
      } else {
        div.classList.add("user");
      }

      // Message HTML: text + meta info
      div.innerHTML = `
      <div class="content">${content}</div>
      <div class="meta">${username} • ${timestamp}</div>
    `;
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function loadMembers() {
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const members = await res.json();
      memberListEl.innerHTML = "";

      if (members.length == 0 || members.error) {
        document.getElementById("membersTitle").style.display = "none";
      }

      members.forEach((m) => {
        const li = document.createElement("li");
        li.textContent = `${m.username} ${m.blocked ? "(Blocked)" : ""}`;

        const actions = document.createElement("span");
        actions.className = "member-actions";

        const kickBtn = document.createElement("button");
        kickBtn.textContent = "🥾";
        kickBtn.title = "Kick Out";
        kickBtn.addEventListener("click", () => kickUser(m.user_id));

        const blockBtn = document.createElement("button");
        blockBtn.textContent = "🚫";
        blockBtn.title = "Block";
        blockBtn.addEventListener("click", () => blockUser(m.user_id));

        actions.appendChild(kickBtn);
        actions.appendChild(blockBtn);
        li.appendChild(actions);

        memberListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function kickUser(targetId) {
    await fetch(`/api/rooms/${roomId}/kick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: targetId }),
    });
    loadMembers();
  }

  async function blockUser(targetId) {
    await fetch(`/api/rooms/${roomId}/block`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: targetId }),
    });
    loadMembers();
  }

  loadMembers();
  setInterval(loadMembers, 5000);
});
