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

    await db.query(
      `INSERT INTO articles (article_id, title, category, content_body, create_date, admin_id, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [article_id, title, category, content_body, create_date, admin_id, author]
    );

    if (tags?.length) {
      for (const tag of tags) {
        await db.query(
          `INSERT INTO tags (tag_id, article_id, tag_text) VALUES ($1, $2, $3)`,
          [uuidv4(), article_id, tag]
        );
      }
    }

    if (sources?.length) {
      for (const source of sources) {
        await db.query(
          `INSERT INTO sources (source_id, article_id, preview_text, source_link)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), article_id, source.preview_text, source.source_link]
        );
      }
    }

    if (images?.length && images.length <= 3) {
      for (const image of images) {
        await db.query(
          `INSERT INTO article_image (image_id, article_id, image) VALUES ($1, $2, $3)`,
          [uuidv4(), article_id, image]
        );
      }
    }

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
      const { rows: tags } = await db.query(
        "SELECT tag_text FROM tags WHERE article_id = $1",
        [article.article_id]
      );
      const { rows: sources } = await db.query(
        "SELECT preview_text, source_link FROM sources WHERE article_id = $1",
        [article.article_id]
      );
      const { rows: images } = await db.query(
        "SELECT image FROM article_image WHERE article_id = $1",
        [article.article_id]
      );

      article.tags = tags.map((t) => t.tag_text);
      article.sources = sources;
      article.images = images.map((i) => i.image);
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

    const { rows: articleResult } = await db.query(
      "SELECT * FROM articles WHERE article_id = $1",
      [id]
    );
    const article = articleResult[0];

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const { rows: tags } = await db.query(
      "SELECT tag_text FROM tags WHERE article_id = $1",
      [id]
    );
    const { rows: sources } = await db.query(
      "SELECT preview_text, source_link FROM sources WHERE article_id = $1",
      [id]
    );
    const { rows: images } = await db.query(
      "SELECT image FROM article_image WHERE article_id = $1",
      [id]
    );

    res.status(200).json({
      ...article,
      tags: tags.map((t) => t.tag_text),
      sources,
      images: images.map((i) => i.image),
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete article, tags, sources, and images
    await db.query("DELETE FROM article_image WHERE article_id = $1", [id]);
    await db.query("DELETE FROM tags WHERE article_id = $1", [id]);
    await db.query("DELETE FROM sources WHERE article_id = $1", [id]);
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

    const result = await db.query(
      "UPDATE articles SET title = $1, category = $2, content_body = $3, author = $4 WHERE article_id = $5",
      [title, category, content_body, author, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    await db.query("DELETE FROM tags WHERE article_id = $1", [id]);
    await db.query("DELETE FROM sources WHERE article_id = $1", [id]);
    await db.query("DELETE FROM article_image WHERE article_id = $1", [id]);

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await db.query(
          "INSERT INTO tags (tag_id, article_id, tag_text) VALUES ($1, $2, $3)",
          [uuidv4(), id, tag]
        );
      }
    }

    if (sources && sources.length > 0) {
      for (const source of sources) {
        await db.query(
          "INSERT INTO sources (source_id, article_id, preview_text, source_link) VALUES ($1, $2, $3, $4)",
          [uuidv4(), id, source.preview_text, source.source_link]
        );
      }
    }

    if (images?.length && images.length <= 3) {
      for (const image of images) {
        await db.query(
          "INSERT INTO article_image (image_id, article_id, image) VALUES ($1, $2, $3)",
          [uuidv4(), id, image]
        );
      }
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
      "SELECT * FROM articles WHERE LOWER(title) LIKE LOWER($1) OR LOWER(content_body) LIKE LOWER($2) ORDER BY create_date DESC",
      [`%${query}%`, `%${query}%`]
    );

    if (articles.length === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    for (const article of articles) {
      const { rows: tags } = await db.query(
        "SELECT tag_text FROM tags WHERE article_id = $1",
        [article.article_id]
      );
      const { rows: sources } = await db.query(
        "SELECT preview_text, source_link FROM sources WHERE article_id = $1",
        [article.article_id]
      );
      const { rows: images } = await db.query(
        "SELECT image FROM article_image WHERE article_id = $1",
        [article.article_id]
      );

      article.tags = tags.map((t) => t.tag_text);
      article.sources = sources;
      article.images = images.map((i) => i.image);
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
    const result = await db.query(
      "SELECT * FROM articles WHERE category = $1 ORDER BY create_date DESC",
      [category]
    );
    const articles = result.rows;

    for (const article of articles) {
      const tagRes = await db.query(
        "SELECT tag_text FROM tags WHERE article_id = $1",
        [article.article_id]
      );
      const sourceRes = await db.query(
        "SELECT preview_text, source_link FROM sources WHERE article_id = $1",
        [article.article_id]
      );
      const imageRes = await db.query(
        "SELECT image FROM article_image WHERE article_id = $1",
        [article.article_id]
      );

      article.tags = tagRes.rows.map((t) => t.tag_text);
      article.sources = sourceRes.rows;
      article.images = imageRes.rows.map((i) => i.image);
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
    console.log("Searching for tag:", tag_text);

    const result = await db.query(
      `SELECT a.* FROM articles a
       JOIN tags t ON a.article_id = t.article_id
       WHERE LOWER(t.tag_text) = LOWER($1)
       ORDER BY a.create_date DESC`,
      [tag_text]
    );
    const articles = result.rows;

    for (const article of articles) {
      const tagRes = await db.query(
        "SELECT tag_text FROM tags WHERE article_id = $1",
        [article.article_id]
      );
      const sourceRes = await db.query(
        "SELECT preview_text, source_link FROM sources WHERE article_id = $1",
        [article.article_id]
      );
      const imageRes = await db.query(
        "SELECT image FROM article_image WHERE article_id = $1",
        [article.article_id]
      );

      article.tags = tagRes.rows.map((t) => t.tag_text);
      article.sources = sourceRes.rows;
      article.images = imageRes.rows.map((i) => i.image);
    }

    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles by tag:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
