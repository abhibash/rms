
document.getElementById("login").addEventListener("click", userLogin);
//Function to perform user login by sending a GET request to the server.
function userLogin() {
  let username = document.getElementById("loginUser").value;
  let password = document.getElementById("loginPassword").value;
  document.getElementById("loginResponse").innerHTML = "";

  let request = new XMLHttpRequest();
  let url =
    "http://127.0.0.1:3000/loginConfirm?username=" +
    username +
    "&password=" +
    password;

  request.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      console.log("Successfully logged in!");
      document.getElementById("loginResponse").innerHTML = "";
      window.location.assign("http://127.0.0.1:3000/");
    } else {
      document.getElementById("loginResponse").innerHTML = request.responseText;
      
    }
  };

  request.open("GET", url);
  request.send();
}
