const form = document.getElementById("createAccountForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Prototype: account opslaan
  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("onboardingComplete", "true");

  // Door naar home
  window.location.href = "home.html";
});

const toggle = document.getElementById("ahBonusToggle");
const input = document.getElementById("ahBonusNumber");

toggle.addEventListener("change", () => {
  input.classList.toggle("hidden", !toggle.checked);
});