// Success (Thành công)
// 200 OK: Yêu cầu thành công.
// 201 Created: Tài nguyên đã được tạo thành công.
// 204 No Content: Yêu cầu thành công nhưng không có nội dung trả về.

export const StatusCode = {
  OK: 200,
  CREATED: 201,
};

export const ReasonStatusCode = {
  OK: "Success",
  CREATED: "Created!",
};

class SuccessResponse {
  constructor({
    message,
    statusCode = StatusCode.OK,
    responseStatusCode = ReasonStatusCode.OK,
    metaData = {},
  }) {
    this.message = message ? message : responseStatusCode;
    this.statusCode = statusCode;
    this.metaData = metaData;
  }
  send(res, headers = {}) {
    return res.status(this.statusCode).json(this);
  }
}

export class OkResponse extends SuccessResponse {
  constructor({ message, metaData }) {
    super({ message, metaData });
  }
}
export class CreatedResponse extends SuccessResponse {
  constructor({
    message,
    statusCode = StatusCode.CREATED,
    responseStatusCode = ReasonStatusCode.CREATED,
    metaData,
  }) {
    super({ message, statusCode, responseStatusCode, metaData });
  }
}
