const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage({
  credentials: JSON.parse(process.env.NEXT_PUBLIC_GOOGLE_KEY_CREDENTIAL),
});

const bucket = storage.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME);

const errorResponse = (res, message, statusCode = 500) => {
  res.status(statusCode).json({ status: "error", message });
};

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File must be an image"), false);
    }
    cb(null, true);
  },
}).array("images", 3);

const uploadFile = (req, res, next) => {
  multerUpload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return errorResponse(res, "File size exceeds the 1MB limit", 400);
      }
      if (err.message === "File must be an image") {
        return errorResponse(res, "Only image files are allowed", 400);
      }
      return res.status(400).json({ status: "fail", error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, "No image uploaded", 400);
    }

    try {
      const uploadedFiles = [];

      for (const file of req.files) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const fileName = `article_image/${timestamp}-${file.originalname}`;
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on("error", reject);
          blobStream.on("finish", () => {
            file.cloudStoragePublicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            uploadedFiles.push(file);
            resolve();
          });
          blobStream.end(file.buffer);
        });
      }

      // overwrite req.files dengan versi yang udah ada URL-nya
      req.files = uploadedFiles;
      next();
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return res
        .status(500)
        .json({ status: "fail", error: "Failed to upload images" });
    }
  });
};

module.exports = uploadFile;
