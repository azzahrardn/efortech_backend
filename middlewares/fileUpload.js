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
  limits: { fileSize: 10 * 1024 * 1024 }, // File size limit 10MB
  fileFilter: (req, file, cb) => {
    const allowedImageMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/heic",
      "image/webp",
    ];
    const allowedFileMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-rar-compressed",
    ];

    // Check if the file is an image or a supported file type
    if (
      allowedImageMimeTypes.includes(file.mimetype) ||
      allowedFileMimeTypes.includes(file.mimetype)
    ) {
      cb(null, true); // Allow file upload
    } else {
      cb(new Error("Only image, PDF, DOCX, or ZIP files are allowed"), false);
    }
  },
}).array("files", 3); // up to 3 files

const getFolderFromPath = (reqPath) => {
  if (reqPath.includes("/registration")) return "registration_payment";
  return "misc_files";
};

const uploadFile = (req, res, next) => {
  multerUpload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json(sendErrorResponse("File size exceeds 10MB limit"));
      }
      if (err.message === "Only image, PDF, DOCX, or ZIP files are allowed") {
        return sendErrorResponse(
          res,
          "Only image, PDF, DOCX, or ZIP files are allowed"
        );
      }
      return sendErrorResponse(res, err.message || "File upload error");
    }

    if (!req.files || req.files.length === 0) {
      return sendErrorResponse(res, "No files uploaded");
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
      return sendErrorResponse(res, "Failed to upload files");
    }
  });
};

module.exports = uploadFile;
