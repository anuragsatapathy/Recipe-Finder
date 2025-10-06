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
  if (searchTerm) {
    searchRecipes(searchTerm);
  } else {
    showMessage("Please enter a search term", true);
  }
});

async function searchRecipes(query) {
  showMessage(`Searching for "${query}"...`, false, true);
  resultsGrid.innerHTML = "";
  try {
    const response = await fetch(`${SEARCH_API_URL}${query}`);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    clearMessage();
    if (data.meals) {
      displayRecipes(data.meals, false);
    } else {
      showMessage(`No recipes found for "${query}"`);
    }
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

function displayRecipes(recipes, isFavorite = false) {
  if (!recipes || recipes.length === 0) return;
  recipes.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;
    const isFav = favorites.includes(recipe.idMeal);
    recipeDiv.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
      <h3>${recipe.strMeal}</h3>
      <button class="fav-btn" data-id="${recipe.idMeal}">
        ${isFav ? "❤️ Added to Favorites" : "🤍 Add to Favorites"}
      </button>
    `;
    resultsGrid.appendChild(recipeDiv);
  });
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
    if (data.meals && data.meals.length > 0) {
      displayRecipes(data.meals, false);
      renderFavorites();
    } else {
      showMessage("Could not fetch a random recipe. Please try again.", true);
    }
  } catch (error) {
    showMessage("Failed to fetch a random recipe. Please try again.", true);
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

resultsGrid.addEventListener("click", (e) => {
  if (e.target.classList.contains("fav-btn")) {
    const id = e.target.dataset.id;
    toggleFavorite(id);
    return;
  }
  const card = e.target.closest(".recipe-item");
  if (card && !e.target.classList.contains("fav-btn")) {
    const recipeId = card.dataset.id;
    getRecipeDetails(recipeId);
  }
});

async function getRecipeDetails(id) {
  modalContent.innerHTML = '<p class="message loading">Loading details...</p>';
  showModal();
  try {
    const response = await fetch(`${LOOKUP_API_URL}${id}`);
    if (!response.ok) throw new Error("Failed to fetch recipe details.");
    const data = await response.json();
    if (data.meals && data.meals.length > 0) {
      displayRecipeDetails(data.meals[0]);
    } else {
      modalContent.innerHTML = '<p class="message error">Could not load recipe details.</p>';
    }
  } catch (error) {
    modalContent.innerHTML = '<p class="message error">Failed to load recipe details.</p>';
  }
}

modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function displayRecipeDetails(recipe) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`]?.trim();
    const measure = recipe[`strMeasure${i}`]?.trim();
    if (ingredient) {
      ingredients.push(`<li>${measure ? `${measure} ` : ""}${ingredient}</li>`);
    } else break;
  }
  modalContent.innerHTML = `
    <h2>${recipe.strMeal}</h2>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
    ${recipe.strCategory ? `<h3>Category: ${recipe.strCategory}</h3>` : ""}
    ${recipe.strArea ? `<h3>Area: ${recipe.strArea}</h3>` : ""}
    ${ingredients.length ? `<h3>Ingredients</h3><ul>${ingredients.join("")}</ul>` : ""}
    <h3>Instructions</h3>
    <p>${recipe.strInstructions ? recipe.strInstructions.replace(/\r?\n/g, "<br>") : "Instructions not available."}</p>
    ${recipe.strYoutube ? `<h3>Video Recipe</h3><div class="video-wrapper"><a href="${recipe.strYoutube}" target="_blank">Watch on YouTube</a></div>` : ""}
    ${recipe.strSource ? `<div class="source-wrapper"><a href="${recipe.strSource}" target="_blank">View Original Source</a></div>` : ""}
  `;
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((fav) => fav !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  resultsGrid.innerHTML = "";
  renderFavorites();
}

async function renderFavorites() {
  if (favorites.length === 0) return;
  for (let id of favorites) {
    try {
      const response = await fetch(`${LOOKUP_API_URL}${id}`);
      const data = await response.json();
      if (data.meals) displayRecipes([data.meals[0]], true);
    } catch (e) {}
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderFavorites();
});
