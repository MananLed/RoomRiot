document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const roomListEl = document.getElementById("room-list");
  const createBtn = document.getElementById("createRoomButton");
  const nameInput = document.getElementById("roomName");
  const passwordInput = document.getElementById("password");

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
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";

        const left = document.createElement("span");
        left.textContent = `${room.name} ${room.password ? "🔒" : "🌐"}`;

        const joinBtn = document.createElement("button");
        joinBtn.textContent = "Join";
        joinBtn.addEventListener("click", () =>
          joinRoom(room.id, !!room.password)
        );

        li.appendChild(left);
        li.appendChild(joinBtn);
        roomListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load rooms");
    }
  }

  async function joinRoom(roomId, hasPassword) {
    let pwd = "";

    const res1 = await fetch(`/api/rooms/${roomId}/member`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    const data1 = await res1.json();

    if (hasPassword && !data1.isMember) {
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
      window.location.href = `/chat/${roomId}`;
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
        body: JSON.stringify({ name, password: pwd }),
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
  localStorage.clear();
  window.location.href = "/login";
});
