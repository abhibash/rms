document
  .getElementById("privacyToggle")
  .addEventListener("click", privacyUpdate);

function privacyUpdate() {
  let privacy = false;
  if (document.getElementById("privateMode").checked) {
    privacy = true;
  }
  console.log(privacy);

  let request = new XMLHttpRequest();
  let url = "http://127.0.0.1:3000/privacyToggle?privacy=" + privacy;

  request.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      console.log("Updated privacy!");
    } else {
      console.log("Error Updating privacy!");
    }
  };

  request.open("GET", url);
  request.send();
}
