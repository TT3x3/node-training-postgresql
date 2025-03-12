const express = require("express");

const router = express.Router();

const { checkName } = require("../utils/validUtils");

const handleErrorAsync = require("../utils/handleErrorAsync");
const skillController = require("../controllers/skill");

// 取得教練專長列表
router.get("/", handleErrorAsync(skillController.getSkills));

// 新增教練專長
router.post("/", checkName, handleErrorAsync(skillController.postSkill));

// 刪除教練專長
router.delete("/:skillId", handleErrorAsync(skillController.deleteSkill));

module.exports = router;
