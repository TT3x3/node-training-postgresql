const bcrypt = require("bcrypt");

const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Users");
const generateJWT = require("../utils/generateJWT"); // 建立JWT方法

const { validationResult } = require("express-validator");

const { isInvalidString } = require("../utils/validUtils");
const appError = require("../utils/appError");
const appSuccess = require("../utils/appSuccess");

const userController = {
  async postUser(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(
        appError(
          400,
          `${errors
            .array()
            .map((e) => e.msg)
            .join(", ")}`
        )
      );
      return;
    }
    const { name, email, password } = req.body;
    const userRepository = dataSource.getRepository("User");
    const findUser = await userRepository.findOne({
      where: { email },
    });

    if (findUser) {
      logger.warn("建立使用者錯誤: Email 已被使用");
      next(appError(409, "Email 已被使用"));
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
  },
  async postUserLogin(req, res, next) {
    const { email, password } = req.body;
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
  },
  async getUser(req, res, next) {
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
  },
  async putUser(req, res, next) {
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(
        appError(
          400,
          `${errors
            .array()
            .map((e) => e.msg)
            .join(", ")}`
        )
      );
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
  },
};

module.exports = userController;
