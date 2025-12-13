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
    <link rel="stylesheet" href="../minion_pet_care/forgot.css">
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
</head>
<body class="login-page">

<header>

  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">

      <!-- LEFT SIDE: Menu Toggle + Logo -->
      <button id="menuToggle" class="pill btn icon me-2" aria-label="Open menu" aria-expanded="false">☰</button>

      <a class="navbar-brand d-flex align-items-center" href="index.html">
        <img src="../img/Logo.png" alt="Minion Pet Care Logo"
             style="height:70px; width:auto; border-radius:50%; margin-right:10px;">
        <span class="fw-bold">Minion Pet Care</span>
      </a>

      <!-- Mobile toggle button (Bootstrap collapse) -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
              data-bs-target="#mainNavbar">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- SEARCH BAR (desktop visible) -->
      <div class="d-none d-lg-flex ms-3 align-items-center">
        <input id="searchInput" class="pill input" type="search"
               placeholder="Search products, breeds, food..." aria-label="Search products">
        <button id="searchBtn" class="pill btn ms-2">Search</button>
      </div>

      <!-- NAV MENU -->
      <div class="collapse navbar-collapse justify-content-end" id="mainNavbar">
        <ul class="navbar-nav mb-2 mb-lg-0 align-items-lg-center">

          <li class="nav-item">
            <a class="nav-link active" href="../index.html">Home</a>
          </li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="pagesDropdown"
               role="button" data-bs-toggle="dropdown">Services</a>

            <ul class="dropdown-menu" aria-labelledby="pagesDropdown">
              <li><a class="dropdown-item" href="../shop.html">Pet Shop</a></li>
              <li><a class="dropdown-item" href="../trainer.html">Pet Trainer</a></li>
              <li><a class="dropdown-item" href="../ved.html">Pet Veterinarian</a></li>
            </ul>
          </li>

          <li class="nav-item"><a class="nav-link" href="../about.html">About</a></li>
          <li class="nav-item"><a class="nav-link" href="../contact.html">Contact</a></li>
          <li class="nav-item"><a class="nav-link nav-btn" href="./minion_pet_care/login.html">Login</a></li>

          <!-- Cart Button -->
          <li class="nav-item ms-lg-2">
            <button id="cartBtn" class="pill btn" aria-label="Open cart">
              🛒 Cart <span id="cartCount" class="badge" aria-live="polite">0</span>
            </button>
          </li>

          <!-- MOBILE SEARCH (only visible on small screens) -->
          <li class="nav-item d-lg-none mt-3">
            <input id="searchInputMobile" class="pill input w-100 mb-2" type="search"
                   placeholder="Search products, breeds, food..." aria-label="Search">
            <button id="searchBtnMobile" class="pill btn w-100">Search</button>
          </li>

        </ul>
      </div>

    </div>
  </nav>

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
      <div class="footer_top">
        <div class="container">
          <div class="row">

            <div class="col-xl-3 col-md-6 col-lg-3">
              <div class="footer_widget">
                <h3 class="footer_title">Contact Us</h3>
                <ul class="address_line">
                  <li>+8801963929839</li>
                  <li><a href="#">minionpetcare@gmail.com</a></li>
                  <li>Daffodil Smart City</li>
                </ul>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 col-lg-3">
              <div class="footer_widget">
                <h3 class="footer_title">Our Services</h3>
                <ul class="links">
                  <li><a href="#">Pet Training</a></li>
                  <li><a href="#">Pet Boarding</a></li>
                  <li><a href="#">Pet Adoption</a></li>
                  <li><a href="#">Pet Veterinarian</a></li>
                </ul>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 col-lg-3">
              <div class="footer_widget">
                <h3 class="footer_title">Quick Link</h3>
                <ul class="links">
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="./login.html">Login info</a></li>
                  <li><a href="#">Contect us</a></li>
                </ul>
              </div>
            </div>

            <div class="col-xl-3 col-md-6 col-lg-3">
              <div class="footer_widget">
                <div class="footer_logo">
                  <a href="#">
                    <img src="../img/Logo.png" alt="Minion Pet Care Logo" class="center-logo"
                      style="height:180px; width:auto; border-radius:70%;">
                  </a>
                </div>
                <p class="center_text">Daffodil Smart City,<br> Asulia, Savar</p>
                <div class="socail_links">
                  <ul>
                    <li><a href="#"><i class="fab fa-facebook-f"></i></a></li>
                    <li><a href="#"><i class="fab fa-pinterest-p"></i></a></li>
                    <li><a href="#"><i class="fab fa-google-plus-g"></i></a></li>
                    <li><a href="#"><i class="fab fa-linkedin-in"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="copy-right_text">
        <div class="container">
          <div class="bordered_1px"></div>
          <p class="copy_right text-center">
            Copyright ©
            <script>document.write(new Date().getFullYear());</script>
            All rights reserved | 
            <i class="ti-heart"></i> by <a href="./index.html" target="_blank">Minion Pet Care</a>
          </p>
        </div>
      </div>
    </footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
