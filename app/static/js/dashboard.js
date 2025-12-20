document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login";
    return;
  }

  const roomListEl = document.getElementById("room-list");
  const createBtn = document.getElementById("createRoomButton");
  const nameInput = document.getElementById("roomName");
  const passwordInput = document.getElementById("password");
  const logoutBtn = document.getElementById("logoutBtn");

  async function loadRooms() {
    try {
      const res = await fetch("/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rooms = await res.json();

      roomListEl.innerHTML = "";
      rooms.forEach((room) => {
        const li = document.createElement("li");
        li.style.marginBottom = "10px";
        li.innerHTML = `
          ${room.name} 
          ${room.password ? "(🔒)" : "(🌐)"} 
          <button style="margin-left:10px;">Join</button>
        `;
        const joinBtn = li.querySelector("button");
        joinBtn.addEventListener("click", () =>
          joinRoom(room.id, !!room.password)
        );
        roomListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load rooms");
    }
  }

  async function joinRoom(roomId, hasPassword) {
    let pwd = "";
    if (hasPassword) {
      pwd = prompt("Enter room password:");
      if (pwd === null) return;
    }

    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: pwd }),
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = `/api/rooms/chat/${roomId}`;
    } else {
      alert(data.error || "Failed to join room");
    }
  }

  createBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const pwd = passwordInput.value.trim();

    if (!name) {
      alert("Room name is required");
      return;
    }

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, password: pwd}),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Room created successfully!");
        nameInput.value = "";
        passwordInput.value = "";
        loadRooms();
      } else {
        alert(data.error || "Failed to create room");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating room");
    }
  });

  loadRooms();
});


logoutBtn.addEventListener("click", () => {
  localStorage.clear()
  window.location.href = "/api/auth/login";
});