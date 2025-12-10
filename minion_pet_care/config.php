<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "minion_pet_care";  // 👈 use THIS name (matches phpMyAdmin)

$conn = mysqli_connect($host, $user, $pass, $dbname);

if (!$conn) {
    die("Database connection failed: " . mysqli_connect_error());
}
?>
