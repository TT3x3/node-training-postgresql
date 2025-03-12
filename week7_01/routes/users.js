const express = require("express");

const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Users");
const auth = require("../middlewares/auth")({
  secret: config.get("secret").jwtSecret, // 傳預設值
  userRepository: dataSource.getRepository("User"), // 連接User資料庫
  logger,
});

const {
  checkName,
  checkEmail,
  checkPassword
} = require("../utils/validUtils");

const handleErrorAsync = require("../utils/handleErrorAsync");
const userController = require("../controllers/user");

// 註冊
router.post("/signup", checkName, checkEmail, checkPassword, handleErrorAsync(userController.postUser));

// 登入
router.post("/login", checkEmail, checkPassword, handleErrorAsync(userController.postUserLogin));

// 登入獲得個人資料(token)
router.get("/profile", auth, handleErrorAsync(userController.getUser));

// 登入編輯個人資料
router.put("/profile", checkName, auth, handleErrorAsync(userController.putUser));

module.exports = router;
