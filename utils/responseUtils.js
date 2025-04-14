// responseUtils.js
const MESSAGES = {
  SUCCESS: {
    GENERAL_SUCCESS: "Request processed successfully",
    FETCH_SUCCESS: "Data fetched successfully",
  },

  ERROR: {
    GENERAL_ERROR: "An error occurred",
    INTERNAL_SERVER_ERROR: "Internal server error",
  },
};

class ApiResponse {
  constructor(status, message, data = null, errorCode = null) {
    this.status = status;
    this.message = message;
    if (data) this.data = data;
    if (errorCode) this.errorCode = errorCode;
  }
}

const sendResponse = (
  res,
  statusCode,
  status,
  messageKey,
  messageGroup = "SUCCESS",
  data = null,
  errorCode = null
) => {
  const message = MESSAGES[messageGroup]?.[messageKey] || messageKey;
  const response = new ApiResponse(status, message, data, errorCode);
  return res.status(statusCode).json(response);
};

const sendSuccessResponse = (res, messageKey, data = null) =>
  sendResponse(res, 200, "success", messageKey, "SUCCESS", data);

const sendCreatedResponse = (res, messageKey, data = null) =>
  sendResponse(res, 201, "success", messageKey, "SUCCESS", data);

const sendBadRequestResponse = (res, messageKey, errorCode = null) =>
  sendResponse(res, 400, "error", messageKey, "ERROR", null, errorCode);

const sendUnauthorizedResponse = (res, messageKey, errorCode = null) =>
  sendResponse(res, 401, "error", messageKey, "ERROR", null, errorCode);

const sendForbiddenResponse = (res, messageKey, errorCode = null) =>
  sendResponse(res, 403, "error", messageKey, "ERROR", null, errorCode);

const sendNotFoundResponse = (res, messageKey, errorCode = null) =>
  sendResponse(res, 404, "error", messageKey, "ERROR", null, errorCode);

const sendErrorResponse = (res, messageKey, errorCode = null) =>
  sendResponse(res, 500, "error", messageKey, "ERROR", null, errorCode);

module.exports = {
  sendSuccessResponse,
  sendCreatedResponse,
  sendBadRequestResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendErrorResponse,
  MESSAGES,
};
