$(".uf-btn").on("click", (e) => {
  let username = $(e.target)[0].classList[0];
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/user/unfollow/" + username);
  xhr.send();
  alert("Unfollowing " + username);
  $(e.target).css("visibility", "hidden");
});

$(".f-btn").on("click", (e) => {
  let username = $(e.target)[0].classList[0];
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/user/follow/" + username);
  xhr.send();
  alert("Following " + username);
  $(e.target).css("visibility", "hidden");
});
