<?php
session_start();
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = $_POST['password'];

    // Find user by email
    $sql = "SELECT * FROM users WHERE email = '$email' LIMIT 1";
    $result = mysqli_query($conn, $sql);

    if ($result && mysqli_num_rows($result) === 1) {
        $user = mysqli_fetch_assoc($result);

        // Check password
        if (password_verify($password, $user['password'])) {
            // Store login info in session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];

            // Redirect to home page after login
            header("Location: ../index.html");  // change if your home page is different
            exit();
        } else {
            echo "Wrong password.";
        }
    } else {
        echo "No user found with this email.";
    }
} else {
    echo "Invalid request.";
}
