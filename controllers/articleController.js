const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const {
  sendSuccessResponse,
  sendCreatedResponse,
  sendBadRequestResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendErrorResponse,
} = require("../utils/responseUtils");

// Add article
exports.addArticle = async (req, res) => {
  try {
    const { title, category, content_body, admin_id, author } = req.body;

    const parsedSources = Array.isArray(req.body.sources)
      ? req.body.sources
      : [];
    const parsedTags = Array.isArray(req.body.tags) ? req.body.tags : [];

    if (!title || !category || !content_body || !admin_id || !author) {
      return sendBadRequestResponse(res, "Missing required fields");
    }

    // Sources validation
    if (
      !Array.isArray(parsedSources) ||
      parsedSources.some((src) => !src.preview_text || !src.source_link)
    ) {
      return sendBadRequestResponse(
        res,
        "Sources must be an array of objects with preview_text and source_link"
      );
    }

    // Tags validation
    if (!Array.isArray(parsedTags)) {
      return sendBadRequestResponse(res, "Tags must be an array of strings");
    }

    // article_id generation
    const create_date = new Date();
    const generateArticleId = () => {
      const now = new Date();
      now.setHours(now.getHours() + 7);
      const timestamp = now
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 12);
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      return `ARTC-${timestamp}-${randomStr}`;
    };

    const article_id = generateArticleId();

    const imageUrls = Array.isArray(req.body.images)
      ? req.body.images.filter(
          (url) => typeof url === "string" && url.startsWith("http")
        )
      : [];

    await db.query(
      `INSERT INTO articles 
      (article_id, title, category, content_body, create_date, admin_id, author, sources, images, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        article_id,
        title,
        category,
        content_body,
        create_date,
        admin_id,
        author,
        JSON.stringify(parsedSources),
        imageUrls,
        parsedTags,
      ]
    );

    sendCreatedResponse(res, "GENERAL_SUCCESS", { article_id });
  } catch (error) {
    console.error("Error adding article:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Get all articles
exports.getArticles = async (req, res) => {
  try {
    const { rows: articles } = await db.query(
      "SELECT * FROM articles ORDER BY create_date DESC"
    );

    for (const article of articles) {
      // Convert images from Buffer to base64 strings
      if (article.images && Array.isArray(article.images)) {
        article.images = Array.isArray(article.images) ? article.images : [];
      } else {
        article.images = [];
      }

      // Ensure sources is array
      article.sources = article.sources || [];

      // Ensure tags is array
      article.tags = article.tags || [];
    }

    sendSuccessResponse(res, "FETCH_SUCCESS", articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      "SELECT * FROM articles WHERE article_id = $1",
      [id]
    );

    const article = rows[0];

    if (!article) {
      return sendNotFoundResponse(res, "GENERAL_ERROR");
    }

    // Convert images from Buffer to base64
    if (article.images && Array.isArray(article.images)) {
      article.images = Array.isArray(article.images) ? article.images : [];
    } else {
      article.images = [];
    }

    article.sources = article.sources || [];
    article.tags = article.tags || [];

    sendSuccessResponse(res, "FETCH_SUCCESS", article);
  } catch (error) {
    console.error("Error fetching article:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Gak perlu hapus dari tabel tags lagi, langsung hapus artikel
    await db.query("DELETE FROM articles WHERE article_id = $1", [id]);

    sendSuccessResponse(res, "GENERAL_SUCCESS");
  } catch (error) {
    console.error("Error deleting article:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Update article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content_body, author, tags, sources, images } =
      req.body;

    if (!title || !category || !content_body || !author) {
      return sendBadRequestResponse(res, "All required fields must be filled");
    }

    // Sources validation
    if (
      !Array.isArray(sources) ||
      sources.some((src) => !src.preview_text || !src.source_link)
    ) {
      return sendBadRequestResponse(
        res,
        "Sources must be an array of objects with preview_text and source_link"
      );
    }

    // Tags validation
    if (!Array.isArray(tags)) {
      return sendBadRequestResponse(res, "Tags must be an array of strings");
    }

    // Image URL validation (optional, just clean)
    const imageUrls = Array.isArray(images)
      ? images.filter(
          (url) => typeof url === "string" && url.startsWith("http")
        )
      : [];

    const result = await db.query(
      `UPDATE articles 
       SET title = $1,
           category = $2,
           content_body = $3,
           author = $4,
           sources = $5,
           images = $6,
           tags = $7
       WHERE article_id = $8`,
      [
        title,
        category,
        content_body,
        author,
        JSON.stringify(sources || []),
        imageUrls,
        tags || [],
        id,
      ]
    );

    if (result.rowCount === 0) {
      return sendNotFoundResponse(res, "GENERAL_ERROR");
    }

    sendSuccessResponse(res, "GENERAL_SUCCESS");
  } catch (error) {
    console.error("Error updating article:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Search articles by title or content
exports.searchArticles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return sendBadRequestResponse(res, "Query parameter is required");
    }

    console.log("Searching for:", query);

    const { rows: articles } = await db.query(
      `SELECT * FROM articles 
       WHERE title ILIKE $1 OR content_body ILIKE $2 
       ORDER BY create_date DESC`,
      [`%${query}%`, `%${query}%`]
    );

    if (articles.length === 0) {
      return sendNotFoundResponse(res, "Article not found");
    }

    for (const article of articles) {
      article.tags = article.tags || [];
      article.sources = article.sources || [];
      article.images = Array.isArray(article.images) ? article.images : [];
    }

    sendSuccessResponse(res, "FETCH_SUCCESS", articles);
  } catch (error) {
    console.error("Error searching articles:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Get articles by category
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const { rows: articles } = await db.query(
      "SELECT * FROM articles WHERE category = $1 ORDER BY create_date DESC",
      [category]
    );

    for (const article of articles) {
      article.tags = article.tags || [];
      article.sources = article.sources || [];
      article.images = Array.isArray(article.images) ? article.images : [];
    }

    sendSuccessResponse(res, "FETCH_SUCCESS", articles);
  } catch (error) {
    console.error("Error fetching articles by category:", error);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};

// Get articles by tag
exports.getArticlesByTag = async (req, res) => {
  try {
    const tag_text = req.params.tag_text;

    if (!tag_text || tag_text.trim() === "") {
      return sendBadRequestResponse(res, "Tag parameter is required.");
    }

    console.log("Searching for tag:", tag_text);

    const { rows: articles } = await db.query(
      `SELECT * FROM articles 
       WHERE EXISTS (
         SELECT 1 FROM unnest(tags) AS tag
         WHERE LOWER(tag) = LOWER($1)
       )
       ORDER BY create_date DESC`,
      [tag_text]
    );

    if (!articles || articles.length === 0) {
      return sendNotFoundResponse(
        res,
        `No articles found for tag '${tag_text}'.`
      );
    }

    for (const article of articles) {
      article.tags = article.tags || [];
      article.sources = article.sources || [];
      article.images = Array.isArray(article.images) ? article.images : [];
    }

    sendSuccessResponse(res, "FETCH_SUCCESS", articles);
  } catch (error) {
    console.error("Error fetching articles by tag:", error.message);
    sendErrorResponse(res, "GENERAL_ERROR");
  }
};
