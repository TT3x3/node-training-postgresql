const express = require("express");

const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackage");
const auth = require("../middlewares/auth")({
  secret: config.get("secret").jwtSecret,
  userRepository: dataSource.getRepository("User"),
  logger,
});

const handleErrorAsync = require("../utils/handleErrorAsync");
const creditPackageController = require("../controllers/creditPackage");

// 取得組合方案列表
router.get("/", handleErrorAsync(creditPackageController.getCreditPackages));

// 新增組合方案
router.post("/", handleErrorAsync(creditPackageController.postCreditPackage));

// 登入後購買方案
router.post("/:creditPackageId", auth, handleErrorAsync(creditPackageController.postCreditPackageId)
);

// 刪除組合方案
router.delete("/:creditPackageId", handleErrorAsync(creditPackageController.deleteCreditPackage)
);

module.exports = router;
