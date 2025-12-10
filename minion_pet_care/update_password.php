<?php
session_start();
require 'config.php';

// If user came here without going through reset_password.php
if (!isset($_SESSION['reset_email'])) {
    header("Location: forgot_password.html");
    exit();
}

$email = $_SESSION['reset_email'];
$message = "";
$error = "";

// When form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    $confirm  = $_POST['confirm_password'] ?? '';

    if ($password !== $confirm) {
        $error = "Passwords do not match.";
    } elseif (strlen($password) < 4) {
        $error = "Password should be at least 4 characters.";
    } else {
        $hashed = password_hash($password, PASSWORD_DEFAULT);

        // SAFER: use prepared statement
        $sql  = "UPDATE users SET password = ? WHERE email = ? LIMIT 1";
        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "ss", $hashed, $email);
            mysqli_stmt_execute($stmt);

            if (mysqli_stmt_affected_rows($stmt) === 1) {
                // Successfully updated
                unset($_SESSION['reset_email']); // clear session
                $message = "Password updated successfully. You can now login.";
                // Redirect to login after 1–2 seconds if you like:
                header("Refresh:2; url=login.html");
            } else {
                $error = "Password update failed. (No rows changed)";
            }

            mysqli_stmt_close($stmt);
        } else {
            $error = "Database error: " . mysqli_error($conn);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Minion Pet Care</title>

    <link rel="shortcut icon" type="image/png" href="../img/Logo.png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="./login.css">
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
</head>
<body class="login-page">

<header>
    <!-- use same header HTML as your other pages, with ../ paths -->
</header>

<main class="login-main py-5">
    <div class="login-container single-form">
        <div class="form-container sign-in">
            <form action="" method="POST">
                <h1>Set New Password</h1>
                <span>Reset password for: <strong><?php echo htmlspecialchars($email); ?></strong></span>

                <?php if (!empty($message)): ?>
                    <p style="color:green; font-size:13px; margin-top:10px;">
                        <?php echo htmlspecialchars($message); ?>
                    </p>
                <?php endif; ?>

                <?php if (!empty($error)): ?>
                    <p style="color:red; font-size:13px; margin-top:10px;">
                        <?php echo htmlspecialchars($error); ?>
                    </p>
                <?php endif; ?>

                <input type="password" name="password" placeholder="New Password" required>
                <input type="password" name="confirm_password" placeholder="Confirm Password" required>

                <button type="submit">Update Password</button>
                <a href="login.html">Back to Login</a>
            </form>
        </div>
    </div>
</main>

<footer class="footer">
    <!-- your footer here -->
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
