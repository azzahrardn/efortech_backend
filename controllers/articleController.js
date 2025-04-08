const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Add article
exports.addArticle = async (req, res) => {
  try {
    const {
      title,
      category,
      content_body,
      admin_id,
      author,
      tags,
      sources,
      images,
    } = req.body;

    if (!title || !category || !content_body || !admin_id || !author) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    if (sources && !Array.isArray(sources)) {
      return res
        .status(400)
        .json({ message: "Sources must be an array of objects" });
    }

    if (sources) {
      for (const s of sources) {
        if (!s.preview_text || !s.source_link) {
          return res.status(400).json({
            message: "Each source must have preview_text and source_link",
          });
        }
      }
    }

    if (images && images.length > 3) {
      return res.status(400).json({ message: "Maximum 3 images allowed" });
    }

    if (tags && !Array.isArray(tags)) {
      return res
        .status(400)
        .json({ message: "Tags must be an array of strings" });
    }

    const create_date = new Date();
    const generateArticleId = () => {
      const now = new Date();
      now.setHours(now.getHours() + 7); // WIB
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
    const parsedImages = (images || []).map((img) =>
      Buffer.from(img, "base64")
    );

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
        JSON.stringify(sources || []),
        parsedImages,
        tags || [], // langsung simpan sebagai array
      ]
    );

    res.status(201).json({ message: "Article added successfully", article_id });
  } catch (error) {
    console.error("Error adding article:", error);
    res.status(500).json({ message: "Internal server error" });
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
        article.images = article.images.map((img) =>
          img ? img.toString("base64") : null
        );
      }

      // Ensure sources is array
      article.sources = article.sources || [];

      // Ensure tags is array
      article.tags = article.tags || [];
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Internal server error" });
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
      return res.status(404).json({ message: "Article not found" });
    }

    // Convert images from Buffer to base64
    if (article.images && Array.isArray(article.images)) {
      article.images = article.images.map((img) =>
        img ? img.toString("base64") : null
      );
    }

    article.sources = article.sources || [];
    article.tags = article.tags || [];

    res.status(200).json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Gak perlu hapus dari tabel tags lagi, langsung hapus artikel
    await db.query("DELETE FROM articles WHERE article_id = $1", [id]);

    res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content_body, author, tags, sources, images } =
      req.body;

    const parsedImages = (images || []).map((img) =>
      Buffer.from(img, "base64")
    );

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
        parsedImages,
        tags || [],
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article updated successfully" });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Search articles by title or content
exports.searchArticles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    console.log("Searching for:", query);

    const { rows: articles } = await db.query(
      `SELECT * FROM articles 
       WHERE LOWER(title) LIKE LOWER($1) OR LOWER(content_body) LIKE LOWER($2) 
       ORDER BY create_date DESC`,
      [`%${query}%`, `%${query}%`]
    );

    if (articles.length === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    for (const article of articles) {
      article.tags = article.tags || [];
      article.sources = article.sources || [];
      article.images =
        article.images?.map((img) => img?.toString("base64")) || [];
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error searching articles:", error);
    res.status(500).json({ message: "Internal server error" });
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
      article.images =
        article.images?.map((img) => img?.toString("base64")) || [];
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles by category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get articles by tag
exports.getArticlesByTag = async (req, res) => {
  try {
    const tag_text = req.params.tag_text;

    if (!tag_text || tag_text.trim() === "") {
      return res.status(400).json({ message: "Tag parameter is required." });
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
      return res
        .status(404)
        .json({ message: `No articles found for tag '${tag_text}'.` });
    }

    for (const article of articles) {
      article.tags = article.tags || [];
      article.sources = article.sources || [];
      article.images =
        article.images?.map((img) => img?.toString("base64")) || [];
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles by tag:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
