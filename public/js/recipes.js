$(".save-recipe-btn").on("click", (e) => {
  let recipeID = e.target.closest(".recipe-wrap").id;
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/recipes/save/" + recipeID);
  xhr.send();
  $(e.target).css("display", "none");
});

$(".unsave-recipe-btn").on("click", (e) => {
  if(confirm("Delete this recipe from your saved list?")){
    let recipeID = e.target.closest(".recipe-wrap").id;
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/recipes/unsave/" + recipeID);
    xhr.send();
    $(e.target).closest(".recipe-wrap").css("display", "none");
  }
});


$(".expand-recipe-btn").on("click", (e) => {
  const recipe = $(e.target)[0].classList[0];
  $(".expanded." + recipe).removeClass("hidden");
  $(e.target).addClass("hidden");
});


$(".collapse-recipe-btn").on("click", (e) => {
  const recipe = $(e.target)[0].classList[0];
  $(".expanded." + recipe).addClass("hidden");
  $(".expand-recipe-btn."+recipe).removeClass("hidden");
});
