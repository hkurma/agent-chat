export enum ErrorCode {
  AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
  OPENAPI_NOT_FOUND = "OPENAPI_NOT_FOUND",
  MCP_NOT_FOUND = "MCP_NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_REQUEST = "INVALID_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export const errorStatus: Record<ErrorCode, number> = {
  AGENT_NOT_FOUND: 404,
  OPENAPI_NOT_FOUND: 404,
  MCP_NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
};

export class APIError extends Error {
  statusCode: number;

  constructor(errorCode: ErrorCode) {
    super(errorCode);
    this.statusCode = errorStatus[errorCode];
  }
}
