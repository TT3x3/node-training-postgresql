const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Users");
const generateJWT = require("../utils/generateJWT"); // 建立JWT方法
const auth = require("../middlewares/auth")({
  secret: config.get("secret").jwtSecret, // 傳預設值
  userRepository: dataSource.getRepository("User"), // 連接User資料庫
  logger,
});

const {
  isValidPassword,
  isValidName,
  isCheckEmail,
  isInvalidString,
} = require("../utils/validUtils");
const appError = require("../utils/appError");
const appSuccess = require("../utils/appSuccess");

// 註冊
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (
      isInvalidString(name) ||
      isInvalidString(email) ||
      isCheckEmail(email) ||
      isInvalidString(password)
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (!isValidPassword(password)) {
      logger.warn(
        "建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      );
      next(
        appError(
          400,
          "建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
        )
      );
      return;
    }
    const userRepository = dataSource.getRepository("User");
    const findUser = await userRepository.findOne({
      where: { email },
    });

    if (findUser) {
      logger.warn("建立使用者錯誤: Email 已被使用");
      next(
        appError(409, {
          status: "failed",
          message: "Email 已被使用",
        })
      );
      return;
    }

    const saltRounds = process.env.SALT_ROUNDS || 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const newUser = userRepository.create({
      name,
      email,
      role: "USER",
      password: hashPassword,
    });

    const savedUser = await userRepository.save(newUser);
    logger.info("新建立的使用者ID:", savedUser.id);

    appSuccess(res, 201, {
      user: {
        id: savedUser.id,
        name: savedUser.name,
      },
    });
  } catch (error) {
    logger.error("建立使用者錯誤:", error);
    next(error);
  }
});

// 登入
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (
      isInvalidString(email) ||
      isCheckEmail(email) ||
      isInvalidString(password)
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (!isValidPassword(password)) {
      logger.warn(
        "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      );
      next(
        appError(
          400,
          "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
        )
      );
      return;
    }
    const userRepository = dataSource.getRepository("User");
    const findUser = await userRepository.findOne({
      select: ["id", "name", "password"],
      where: { email },
    });

    if (!findUser) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }
    logger.info(`使用者資料: ${JSON.stringify(findUser)}`);
    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }
    const token = await generateJWT(
      {
        id: findUser.id,
      },
      config.get("secret.jwtSecret"),
      {
        expiresIn: `${config.get("secret.jwtExpiresDay")}`,
      }
    );

    appSuccess(res, 200, {
      token,
      user: {
        name: findUser.name,
      },
    });
  } catch (error) {
    logger.error("登入錯誤:", error);
    next(error);
  }
});

// 登入獲得個人資料(token)
router.get("/profile", auth, async (req, res, next) => {
  try {
    const { id } = req.user;
    if (isInvalidString(id)) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const userRepository = dataSource.getRepository("User");
    const User = await userRepository.findOne({
      select: ["name", "email"],
      where: { id },
    });
    appSuccess(res, 200, { User });
  } catch (error) {
    logger.error("取得使用者資料錯誤:", error);
    next(error);
  }
});

// 登入編輯個人資料
router.put("/profile", auth, async (req, res, next) => {
  try {
    const { id } = req.user;
    const { name } = req.body;
    if (isInvalidString(name)) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    const userRepository = dataSource.getRepository("User");
    const findUser = await userRepository.findOne({
      select: ["name"],
      where: {
        id,
      },
    });
    if (findUser.name === name) {
      next(appError(400, "使用者名稱未變更"));
      return;
    }
    if (!isValidName(name)) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    const updatedResult = await userRepository.update(
      {
        id,
        name: findUser.name,
      },
      {
        name,
      }
    );
    if (updatedResult.affected === 0) {
      next(appError(400, "更新使用者資料失敗"));
      return;
    }
    const result = await userRepository.findOne({
      select: ["name"],
      where: {
        id,
      },
    });

    appSuccess(res, 200, result);
  } catch (error) {
    logger.error("取得使用者資料錯誤:", error);
    next(error);
  }
});

module.exports = router;
