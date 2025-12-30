const form = document.getElementById("loginForm");

// Fake account (demo)
const FAKE_ACCOUNT = {
  email: "demo@proteinmirror.com",
  password: "demo123"
};

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("Login attempt:", email, password);

  if (
    email === FAKE_ACCOUNT.email &&
    password === FAKE_ACCOUNT.password
  ) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);

    window.location.href = "/Protein-Mirror-blok-3/home.html";
  } else {
    alert(
      "Invalid login.\nTry:\nEmail: demo@proteinmirror.com\nPassword: demo123"
    );
  }
});