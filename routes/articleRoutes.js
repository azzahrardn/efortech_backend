const express = require("express");
const {
  addArticle,
  getArticles,
  getArticleById,
  deleteArticle,
  updateArticle,
  searchArticles,
  getArticlesByCategory,
  getArticlesByTag,
} = require("../controllers/articleController");

const router = express.Router();

// Endpoint for adding an article
router.post("/add", addArticle);

// Endpoint for getting all articles
router.get("/", getArticles);

// Endpoint for searching articles
router.get("/search", searchArticles);

// Endpoint for getting articles by category
router.get("/category/:category", getArticlesByCategory);

// Endpoint for getting articles by tag
router.get("/tag/:tag_text", getArticlesByTag);

// Endpoint for getting an article by ID
router.get("/:id", getArticleById);

// Endpoint for deleting an article by ID
router.delete("/:id", deleteArticle);

// Endpoint for updating an article by ID
router.put("/update/:id", updateArticle);

module.exports = router;
