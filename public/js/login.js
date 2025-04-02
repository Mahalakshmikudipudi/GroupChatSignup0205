const socket = io("http://localhost:3000");

async function login(e) {
    e.preventDefault();

    const loginDetails = {
        email: e.target.email.value,
        password: e.target.password.value
    };

    // Emit login event to the server
    socket.emit("login", loginDetails);

    // Listen for server response
    socket.on("login-response", (data) => {
        if (data.success) {
            alert("Login successful");
            localStorage.setItem("token", data.token); // Store token in localStorage
            window.location.href = "../html/chatapp.html"; // Redirect to chat page
        } else {
            alert(data.message);
            document.body.innerHTML += `<div style="color:red;">${data.message}</div>`;
        }

        // Clear input fields
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
    });
}
