<?php
session_start();
require 'config.php';   // connect to database

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the form
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = $_POST['password'];

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert into database
    $sql = "INSERT INTO users (name, email, password)
            VALUES ('$name', '$email', '$hashedPassword')";

    if (mysqli_query($conn, $sql)) {
        // Success → back to login page
        $_SESSION['message'] = "Registration successful! Please login.";
        header("Location: login.html");
        exit();
    } else {
        echo "Error: " . mysqli_error($conn);
    }
} else {
    echo "Invalid request.";
}
