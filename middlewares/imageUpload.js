const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const { sendErrorResponse } = require("../utils/responseUtils");

const storage = new Storage({
  credentials: JSON.parse(process.env.NEXT_PUBLIC_GOOGLE_KEY_CREDENTIAL),
});

const bucket = storage.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File must be an image"), false);
    }
    cb(null, true);
  },
}).array("images", 3); // up to 3 images

const getFolderFromPath = (reqPath) => {
  if (reqPath.includes("/articles")) return "article_image";
  if (reqPath.includes("/user")) return "user_image";
  if (reqPath.includes("/training")) return "training_image";
  if (reqPath.includes("/partner")) return "partner_logo";
  if (reqPath.includes("/home")) return "home_content";
  return "misc_image"; // fallback
};

const uploadFile = (req, res, next) => {
  multerUpload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json(sendErrorResponse("File size exceeds 1MB limit"));
      }
      if (err.message === "File must be an image") {
        return sendErrorResponse(res, "Only image files are allowed");
      }
      return sendErrorResponse(res, err.message || "File upload error");
    }

    if (!req.files || req.files.length === 0) {
      return sendErrorResponse(res, "No image uploaded");
    }

    try {
      const uploadedFiles = [];
      const folder = getFolderFromPath(req.originalUrl); // 💡 ambil folder dari route path

      for (const file of req.files) {
        const getWIBTimestamp = () => {
          const now = new Date();
          const wibOffset = 7 * 60 * 60 * 1000;
          const wib = new Date(now.getTime() + wibOffset);
          return wib
            .toISOString()
            .replace(/[-T:.Z]/g, "")
            .slice(0, 14);
        };

        const timestamp = getWIBTimestamp();

        const ext = path.extname(file.originalname);
        const safeName = file.originalname.replace(/\s+/g, "_");
        const fileName = `${folder}/${timestamp}-${safeName}`;
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

      req.files = uploadedFiles;
      next();
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return sendErrorResponse(res, "Failed to upload images");
    }
  });
};

module.exports = uploadFile;
