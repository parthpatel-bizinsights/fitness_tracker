class apiError extends Error {
  constructor(
    http_status,
    http_code,
    message = "Something went wrong",
    data,
    stack = "",
  ) {
    super(message);
    this.http_status = http_status;
    this.http_code = http_code;
    this.message = message;
    this.data = data;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = apiError;
