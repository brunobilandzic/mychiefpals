const https = require("https");
const fs = require("fs");
const apiKey = process.env.apiKey;
const shortRecipeKeys = ["title", "image", "cuisines","dishTypes", "cheap", "diets", "spoonacularScore", "healthScore", "readyInMinutes" , "nutrition"];
const longRecipeKeys = shortRecipeKeys.concat(["extendedIngredients", "instructions", "sourceUrl"]);

function generateShortRecipeList(recipes, render){
  let ids = "";
  recipes.forEach((recipe, index) => {
    ids += recipe.id;
    if(index!=recipes.length-1)
      ids +=","
  });
  let url = "https://api.spoonacular.com/recipes/informationBulk?includeNutrition=true&apiKey=" + apiKey +"&ids=" + ids;
  https.get(url, (res) => {
    console.log("URL:" + url + " URLEND");
    let body= "";
    res.on("data", (chunk)=> {
      body+= chunk;
    })
    res.on("end", () => {
      const recipes_data = JSON.parse(body);
      render(recipes_data);
    });
  });
}
module.exports.addNewRecipe = (recId, callback) => {
  let url = "https://api.spoonacular.com/recipes/"+ recId + "/information?includeNutrition=true&apiKey=" + apiKey;
  https.get(url, (res) => {
    console.log("URL:" + url + " URLEND");
    let body="";
    res.on("data", (chunk)=> {
      body+= chunk;
    })
    res.on("end", () => {
      callback(JSON.parse(body));
    });
  });
}

module.exports.executeQuery = (query, render) => {
  let url = "https://api.spoonacular.com/recipes/complexSearch?apiKey=" + apiKey;
  if(query["sort"]=="none"){
    query["sortDirection"]="none";
  }
  if(typeof(query["number"])=="undefined" || query["number"]==""){
    query["number"] = 5;
  }
  Object.keys(query).forEach((p) => {
    if (query[p] != "none" && typeof(query[p])!="undefined" && query[p]!="") {
      url += "&" + p + "=" + query[p];
    }
  });
  https.get(url, (res) => {
    console.log("APIURL:" + url + " APIURLEND");
    let body="";
    res.on("data", (chunk)=> {
      body+= chunk;
    })
    res.on("end", () => {
      generateShortRecipeList(JSON.parse(body).results, (recipes) => {
        render(recipes);
      });
    });
  });
  // render(data.informationBulk);
}
