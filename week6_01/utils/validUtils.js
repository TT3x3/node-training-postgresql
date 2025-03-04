const isValidPassword = (value) => {
  const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
  return passwordPattern.test(value);
};

const isValidName = (value) => {
  const namePattern = /^(?!\s)[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/;
  return namePattern.test(value);
};

const isInvalidEmail = (value) => {
  const checkEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return !checkEmail.test(value);
};

const isInvalidString = (value) => {
  return (
    value === undefined || typeof value !== "string" || value.trim().length === 0
  );
};

const isInvalidInteger = (value) => {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
};

module.exports = {
  isValidPassword,
  isValidName,
  isInvalidEmail,
  isInvalidString,
  isInvalidInteger,
};
