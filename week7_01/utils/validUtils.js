const { check } = require("express-validator");

const isInvalidString = (value) => {
  return (
    value === undefined ||
    typeof value !== "string" ||
    value.trim().length === 0
  );
};

const isInvalidInteger = (value) => {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
};

const checkName = [
  check("name")
    .notEmpty()
    .withMessage("欄位未填寫正確")
    .withMessage("欄位未填寫正確")
    .matches(/^(?!\s)[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/)
    .withMessage("欄位未填寫正確"),
];

const checkEmail = [
  check("email")
    .notEmpty().withMessage("欄位未填寫正確")
    .isEmail().withMessage("欄位未填寫正確")
    .matches(/^[a-zA-Z0-9._-]{4,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).withMessage("欄位未填寫正確")
];

const checkPassword = [
  check("password")
  .notEmpty().withMessage("欄位未填寫正確")
  .isLength({ min: 8, max: 16 }).withMessage("欄位未填寫正確")
  .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/).withMessage("欄位未填寫正確"),
]

module.exports = {
  isInvalidString,
  isInvalidInteger,
  checkName,
  checkEmail,
  checkPassword
};
