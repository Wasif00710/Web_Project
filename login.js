// ===== Login Page JavaScript =====

function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === "" || password === "") {
        alert("Please fill in all fields!");
        return;
    }

    const emailCheck = /\S+@\S+\.\S+/;
    if (!emailCheck.test(email)) {
        alert("Enter a valid email!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters!");
        return;
    }

    alert("Login Successful!");
}

// Press Enter key to login
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        login();
    }
});
