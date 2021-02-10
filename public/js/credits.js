$(window).on("load", () => {
  let xhr = new XMLHttpRequest();
  xhr.onload = function() {
    let data = JSON.parse(this.responseText);
    $(".prompt-credits-count").text(data.credits);
    $(".prompt-credits-date").text(new Date(new Date(data.credits_updated).getTime() + 86400000).toLocaleString());
  }
  xhr.open("POST", "/recipes/updatecredits");
  xhr.send();
});
