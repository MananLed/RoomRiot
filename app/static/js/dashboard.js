document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login";
    return;
  }

  const roomListEl = document.getElementById("room-list");
  const createBtn = document.querySelector(".card button");
  const nameInput = document.querySelector(".card input:nth-child(2)");
  const passwordInput = document.querySelector(".card input:nth-child(4)");

  // Load existing rooms
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
        joinBtn.addEventListener("click", () => joinRoom(room.id, room.password));
        roomListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load rooms");
    }
  }

  // Join room
  async function joinRoom(roomId, hasPassword) {
    let pwd = "";
    if (hasPassword) {
      pwd = prompt("Enter room password:");
      if (pwd === null) return; // Cancelled
    }

    try {
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
    } catch (err) {
      console.error(err);
      alert("Error joining room");
    }
  }

  // Create room
  createBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const pwd = passwordInput.value.trim();

    if (!name) {
      alert("Room name is required");
      return;
    }

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, password: pwd || null }),
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

  // Initial load
  loadRooms();
});
