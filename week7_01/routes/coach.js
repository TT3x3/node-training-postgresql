const express = require("express");

const router = express.Router();

const handleErrorAsync = require("../utils/handleErrorAsync");
const coachController = require("../controllers/coach");

// 取得教練列表
router.get("/", handleErrorAsync(coachController.getCoaches));

// 取得教練詳細資訊
router.get("/:coachId", handleErrorAsync(coachController.getCoachId));

module.exports = router;
