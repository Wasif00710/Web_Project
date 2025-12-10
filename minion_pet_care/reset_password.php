<?php
session_start();
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');

    $email = mysqli_real_escape_string($conn, $email);

    $sql = "SELECT id FROM users WHERE email = '$email' LIMIT 1";
    $result = mysqli_query($conn, $sql);

    if ($result && mysqli_num_rows($result) === 1) {
        // Email exists – store in session and go to update form
        $_SESSION['reset_email'] = $email;
        header("Location: update_password.php");
        exit();
    } else {
        // Email not found
        $_SESSION['reset_error'] = "No account found with that email.";
        header("Location: forgot_password.html");
        exit();
    }
} else {
    header("Location: forgot_password.html");
    exit();
}
