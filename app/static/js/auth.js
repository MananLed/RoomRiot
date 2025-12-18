document.addEventListener("DOMContentLoaded", () => {
  // Determine page type: login or signup
  const isLoginPage = window.location.pathname.includes("login");

  // Select the main button
  const btn = document.querySelector("button");

  btn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Username and password are required");
      return;
    }

    let url = "";
    let body = {};

    if (isLoginPage) {
      url = "/api/auth/login";
      body = { username, password };
    } else {
      // Signup page
      const confirm = document.getElementById("confirm-password").value.trim();
      if (password !== confirm) {
        alert("Passwords do not match");
        return;
      }
      url = "/api/auth/signup";
      body = { username, password };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (isLoginPage) {
          // Login success → store JWT and go to dashboard
          localStorage.setItem("token", data.access_token);
          window.location.href = "/api/rooms/dashboard";
        } else {
          // Signup success → redirect to login
          alert("Signup successful! Please login.");
          window.location.href = "login";
        }
      } else {
        // API returned an error
        alert(data.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console for details.");
    }
  });
});
