//Register Button
document.getElementById("registerBtn").addEventListener("click", userRegister);

//Function to perform user registeration by send a GET request to the server
function userRegister() {
  let username = document.getElementById("registerUser").value;
  let password = document.getElementById("registerPassword").value;
  let regresponse = document.getElementById("registerResponse");
  if (regresponse.hasChildNodes()) {
    regresponse.removeChild(regresponse.childNodes[0]);
  }

  let request = new XMLHttpRequest();
  let url =
    "http://127.0.0.1:3000/registerConfirm?username=" +
    username +
    "&password=" +
    password;

  request.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      console.log("Successfully registered a user!");
      window.location.assign(request.responseText);
    } else if (this.readyState == 4 && this.status != 200) {
      document.getElementById("registerResponse").innerHTML =
        request.responseText;
    }
  };

  request.open("GET", url);
  request.send();
}
