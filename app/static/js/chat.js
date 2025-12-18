document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  // Get room ID from URL
  const roomId = window.location.pathname.split("/").pop();
  const messagesEl = document.getElementById("messages");
  const memberListEl = document.getElementById("member-list");
  const inputEl = document.getElementById("message-input");

  // Connect SocketIO with JWT
  const socket = io({ auth: { token } });

  socket.on("connect", () => {
    socket.emit("join_room", { room_id: roomId, user_id: null }); // user_id backend extracts from token
  });

  // Receive previous messages
  socket.on("message_history", (messages) => {
    messages.forEach((msg) => {
      appendMessage(msg.username, msg.content, msg.timestamp);
    });
  });

  // Receive new messages
  socket.on("new_message", (msg) => {
    appendMessage(msg.username, msg.content, msg.timestamp);
  });

  // Kicked / blocked
  socket.on("force_leave", (data) => {
    alert("You were removed from the room");
    window.location.href = "/dashboard";
  });

  // Room deleted
  socket.on("room_deleted", (data) => {
    alert("This room was deleted by the owner");
    window.location.href = "/dashboard";
  });

  // Send message
  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const content = inputEl.value.trim();
      if (content) {
        socket.emit("send_message", { room_id: roomId, content });
        inputEl.value = "";
      }
    }
  });

  // Helper function
  function appendMessage(username, content, timestamp) {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${username}</strong> [${timestamp}]: ${content}`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Load members periodically (or via socket update)
  async function loadMembers() {
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const members = await res.json();
      memberListEl.innerHTML = "";
      members.forEach((m) => {
        const li = document.createElement("li");
        li.textContent = `${m.username} ${m.blocked ? "(Blocked)" : ""}`;
        memberListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }

  loadMembers();
  setInterval(loadMembers, 5000); // Refresh member list every 5s
});
