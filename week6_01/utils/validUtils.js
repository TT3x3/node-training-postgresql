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
    .withMessage("名稱不能為空")
    .withMessage("名稱長度需在 2-10 個字內")
    .matches(/^(?!\s)[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/)
    .withMessage(
      "名稱格式不正確，請使用中文字、英文字母或數字，並且不能以空格開頭"
    ),
];

const checkEmail = [
  check("email")
    .notEmpty().withMessage("名稱不能為空")
    .isEmail().withMessage("Email格式錯誤")
    .matches(/^[a-zA-Z0-9._-]{4,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).withMessage("無效的Email")
];

const checkPassword = [
  check("password")
  .notEmpty().withMessage("名稱不能為空")
  .isLength({ min: 8, max: 16 }).withMessage("名稱長度需在 8-16 個字內")
  .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/).withMessage("需要包含英文數字大小寫"),
]

module.exports = {
  isInvalidString,
  isInvalidInteger,
  checkName,
  checkEmail,
  checkPassword
};
