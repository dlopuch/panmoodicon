module.exports = class UserError extends Error {
  constructor(userMessage, internalMessage) {
    super(internalMessage || userMessage);
    this.userMessage = userMessage;
    this.status = 400;
  }
};
