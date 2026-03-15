const urlParams = new URLSearchParams(window.location.search);

// Product Added
if (urlParams.get("success")) {
  Swal.fire({
    icon: "success",
    title: "Product Added!",
    text: "Product inserted successfully.",
    confirmButtonColor: "#7fad39",
  });

  window.history.replaceState({}, document.title, window.location.pathname);
}

// Registration Successful
if (urlParams.get("registered")) {
  Swal.fire({
    icon: "success",
    title: "Registration Successful!",
    text: "You can now login.",
    confirmButtonColor: "#7fad39",
  });

  window.history.replaceState({}, document.title, window.location.pathname);
}

// Login Successful
if (urlParams.get("login")) {
  Swal.fire({
    icon: "success",
    title: "Login Successful!",
    text: "Welcome back!",
    confirmButtonColor: "#7fad39",
  });

  window.history.replaceState({}, document.title, window.location.pathname);
}