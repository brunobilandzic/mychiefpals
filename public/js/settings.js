$(".private-btn").on("click", (e) => {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/user/private");
  xhr.send();
  alert("You made your profile private, from now on, no body can search and follow you, and your newly saved recipes wont show on the feed.");
  $(e.target).css("display", "none");
});
$(".public-btn").on("click", (e) => {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/user/public");
  xhr.send();
  alert("You made your profile public, from now on, everybody can search and follow you, and your newly saved recipes will show on the feed.");
  $(e.target).css("display", "none");
});
