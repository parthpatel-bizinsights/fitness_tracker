class apiResponse {
  constructor(http_status, http_code, message, data) {
    this.http_status = http_status;
    this.http_code = http_code;
    this.message = message;
    this.data = data;
  }
}

module.exports = apiResponse;
