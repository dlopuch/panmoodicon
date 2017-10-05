module.exports = class NotFoundError extends Error {
  constructor(userMessage, internalMessage) {
    super(internalMessage || userMessage);
    this.userMessage = userMessage || 'Not Found';
    this.status = 404;
  }
};
