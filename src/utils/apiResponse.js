// Standard API response format
const success = (data = null, message = "Success", meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta,
  };
};

const error = (error, code = null, details = null) => {
  const response = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return response;
};

// Pagination response
const paginated = (data, pagination) => {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < pagination.total,
      hasPrevPage: pagination.page > 1,
    },
  };
};

// Created response (201)
const created = (data = null, message = "Resource created successfully") => {
  return {
    success: true,
    message,
    data,
  };
};

// No content response (204)
const noContent = () => {
  return {
    success: true,
  };
};

// Response with scan metadata
const scanned = (scanData, metadata) => {
  return {
    success: true,
    data: scanData,
    metadata: {
      ...metadata,
      scanTime: new Date().toISOString(),
    },
  };
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  scanned,
};
