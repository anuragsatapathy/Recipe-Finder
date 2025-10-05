const SEARCH_API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const RANDOM_API_URL = "https://www.themealdb.com/api/json/v1/1/random.php";
const LOOKUP_API_URL = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsGrid = document.getElementById("results-grid");
const messageArea = document.getElementById("message-area");
const randomButton = document.getElementById("random-button");
const modal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("recipe-details-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = searchInput.value.trim();
  if (searchTerm) searchRecipes(searchTerm);
  else showMessage("Please enter a search term", true);
});

async function searchRecipes(query) {
  showMessage(`Searching for "${query}"...`, false, true);
  resultsGrid.innerHTML = "";
  try {
    const response = await fetch(`${SEARCH_API_URL}${query}`);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    clearMessage();
    if (data.meals) displayRecipes(data.meals);
    else showMessage(`No recipes found for "${query}"`);
  } catch (error) {
    showMessage("Something went wrong, Please try again.", true);
  }
}

function showMessage(message, isError = false, isLoading = false) {
  messageArea.textContent = message;
  messageArea.className = "message";
  if (isError) messageArea.classList.add("error");
  if (isLoading) messageArea.classList.add("loading");
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message";
}

function displayRecipes(recipes) {
  if (!recipes || recipes.length === 0) {
    showMessage("No recipes to display");
    return;
  }
  recipes.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;
    const isFav = favorites.includes(recipe.idMeal);
    recipeDiv.innerHTML = `
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
        <h3>${recipe.strMeal}</h3>
        <button class="fav-btn">${isFav ? "Remove from Favorites ❤️" : "Add to Favorites 🤍"}</button>
    `;
    resultsGrid.appendChild(recipeDiv);
  });
}

resultsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".recipe-item");
  if (!card) return;
  const recipeId = card.dataset.id;
  if (e.target.classList.contains("fav-btn")) toggleFavorite(recipeId, e.target);
  else getRecipeDetails(recipeId);
});

function toggleFavorite(recipeId, button) {
  if (favorites.includes(recipeId)) {
    favorites = favorites.filter((id) => id !== recipeId);
    button.textContent = "Add to Favorites 🤍";
  } else {
    favorites.push(recipeId);
    button.textContent = "Remove from Favorites ❤️";
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

randomButton.addEventListener("click", getRandomRecipe);

async function getRandomRecipe() {
  showMessage("Fetching a random recipe...", false, true);
  resultsGrid.innerHTML = "";
  try {
    const response = await fetch(RANDOM_API_URL);
    if (!response.ok) throw new Error("Something went wrong.");
    const data = await response.json();
    clearMessage();
    if (data.meals && data.meals.length > 0) displayRecipes(data.meals);
    else showMessage("Could not fetch a random recipe. Please try again.", true);
  } catch (error) {
    showMessage("Failed to fetch a random recipe. Please check your connection and try again.", true);
  }
}

function showModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

async function getRecipeDetails(id) {
  modalContent.innerHTML = '<p class="message loading">Loading details...</p>';
  showModal();
  try {
    const response = await fetch(`${LOOKUP_API_URL}${id}`);
    if (!response.ok) throw new Error("Failed to fetch recipe details.");
    const data = await response.json();
    if (data.meals && data.meals.length > 0) displayRecipeDetails(data.meals[0]);
    else modalContent.innerHTML = '<p class="message error">Could not load recipe details.</p>';
  } catch (error) {
    modalContent.innerHTML = '<p class="message error">Failed to load recipe details. Check your connection or try again.</p>';
  }
}

function displayRecipeDetails(recipe) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`]?.trim();
    const measure = recipe[`strMeasure${i}`]?.trim();
    if (ingredient) ingredients.push(`<li>${measure ? `${measure} ` : ""}${ingredient}</li>`);
    else break;
  }
  const categoryHTML = recipe.strCategory ? `<h3>Category: ${recipe.strCategory}</h3>` : "";
  const areaHTML = recipe.strArea ? `<h3>Area: ${recipe.strArea}</h3>` : "";
  const ingredientsHTML = ingredients.length ? `<h3>Ingredients</h3><ul>${ingredients.join("")}</ul>` : "";
  const instructionsHTML = `<h3>Instructions</h3><p>${recipe.strInstructions ? recipe.strInstructions.replace(/\r?\n/g, "<br>") : "Instructions not available."}</p>`;
  const youtubeHTML = recipe.strYoutube ? `<h3>Video Recipe</h3><div class="video-wrapper"><a href="${recipe.strYoutube}" target="_blank">Watch on YouTube</a><div>` : "";
  const sourcHTML = recipe.strSource ? `<div class="source-wrapper"><a href="${recipe.strSource}" target="_blank">View Original Source</a></div>` : "";
  const favButtonText = favorites.includes(recipe.idMeal) ? "Remove from Favorites ❤️" : "Add to Favorites 🤍";
  modalContent.innerHTML = `
    <h2>${recipe.strMeal}</h2>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
    ${categoryHTML}
    ${areaHTML}
    ${ingredientsHTML}
    ${instructionsHTML}
    ${youtubeHTML}
    ${sourcHTML}
    <button id="modal-fav-btn">${favButtonText}</button>
  `;
  document.getElementById("modal-fav-btn").addEventListener("click", () => toggleFavorite(recipe.idMeal, document.getElementById("modal-fav-btn")));
}

window.addEventListener("DOMContentLoaded", () => {
  if (favorites.length > 0) {
    const favoriteMeals = [];
    favorites.forEach(async (id) => {
      try {
        const response = await fetch(`${LOOKUP_API_URL}${id}`);
        if (!response.ok) throw new Error("Failed to fetch favorite");
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
          displayRecipes([data.meals[0]]);
        }
      } catch (error) {
        console.log("Error loading favorite:", error);
      }
    });
  }
});
