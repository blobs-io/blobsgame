const socket = io.connect("blobs-io.glitch.me");

document.getElementById("register-btn").addEventListener("click", function() {
  socket.emit("register", {
    username: document.getElementById("user").value,
    password: document.getElementById("pass").value
  });
});

const message = "<div id=\"<type>-notif\"><message></div>";

socket.on("register", function(data){
  if([400, 500].indexOf(data.status) > -1){
    document.getElementById("auth").innerHTML = message.replace("<type>", "failure").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
  } else {
  document.getElementById("auth").innerHTML = message.replace("<type>", "success").replace("<message>", data.message) + document.getElementById("auth").innerHTML;
  }
});
