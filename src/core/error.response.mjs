// Informational (Thông tin)
// 100 Continue: Server đã nhận được phần đầu của yêu cầu và client nên tiếp tục gửi phần còn lại.
// 101 Switching Protocols: Server đồng ý chuyển đổi giao thức theo yêu cầu của client.

// Redirection (Chuyển hướng)
// 301 Moved Permanently: Tài nguyên đã được chuyển vĩnh viễn sang URL mới.
// 302 Found: Tài nguyên tạm thời được tìm thấy ở một URL khác.
// 304 Not Modified: Tài nguyên không thay đổi, client có thể dùng bản cache.
// Client Error (Lỗi từ phía client)
// 400 Bad Request: Yêu cầu không hợp lệ (cú pháp sai, dữ liệu không đúng).
// 401 Unauthorized: Yêu cầu xác thực (client chưa đăng nhập).
// 403 Forbidden: Client không có quyền truy cập tài nguyên.
// 404 Not Found: Tài nguyên không được tìm thấy.
// 429 Too Many Requests: Client gửi quá nhiều yêu cầu trong thời gian ngắn (rate limiting).
// Server Error (Lỗi từ phía server)
// 500 Internal Server Error: Lỗi server chung, không xác định được nguyên nhân.
// 502 Bad Gateway: Server trung gian (gateway) nhận được phản hồi không hợp lệ từ server khác.
// 503 Service Unavailable: Server tạm thời không khả dụng (quá tải, bảo trì).
// 504 Gateway Timeout: Server trung gian không nhận được phản hồi kịp thời.

export const StatusCode = {
  FORBIDDEN: 403,
  CONFLICT: 409,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER: 500,
};

export const ReasonStatusCode = {
  FORBIDDEN: "Forbidden",
  CONFLICT: "Conflict",
  NOT_FOUND: "Not Found",
  INTERNAL_SERVER: "Internal Server Error",
  UNAUTHORIZED: "Unauthorized",
};

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(
    message = ReasonStatusCode.FORBIDDEN,
    statusCode = StatusCode.FORBIDDEN
  ) {
    super(message, statusCode);
  }
}

export class ConflictError extends ErrorResponse {
  constructor(
    message = ReasonStatusCode.CONFLICT,
    statusCode = StatusCode.CONFLICT
  ) {
    super(message, statusCode);
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(
    message = ReasonStatusCode.NOT_FOUND,
    statusCode = StatusCode.NOT_FOUND
  ) {
    super(message, statusCode);
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(
    message = ReasonStatusCode.UNAUTHORIZED,
    statusCode = StatusCode.UNAUTHORIZED
  ) {
    super(message, statusCode);
  }
}

export class InternalServerError extends ErrorResponse {
  constructor(
    message = ReasonStatusCode.INTERNAL_SERVER,
    statusCode = StatusCode.INTERNAL_SERVER
  ) {
    super(message, statusCode);
  }
}
