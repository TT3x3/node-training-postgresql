const { dataSource } = require("../db/data-source");
const { isInvalidString } = require("../utils/validUtils");
const { validationResult } = require("express-validator");
const appError = require("../utils/appError");
const appSuccess = require("../utils/appSuccess");

const skillController = {
  async getSkills(req, res, next) {
    const data = await dataSource.getRepository("Skill").find({
      select: ["id", "name"],
    });
    appSuccess(res, 200, data);
  },
  async postSkill(req, res, next) {
    const { name } = req.body;
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
    const skillRepo = dataSource.getRepository("Skill");
    const findSkill = await skillRepo.findOneBy({ name });
    if (findSkill) {
      next(appError(409, "資料重複"));
      return;
    }
    const newSkill = skillRepo.create({
      name,
    });
    const result = await skillRepo.save(newSkill);
    appSuccess(res, 201, result);
  },
  async deleteSkill(req, res, next) {
    const { skillId } = req.params;
    if (isInvalidString(skillId)) {
      next(appError(400, "ID錯誤"));
      return;
    }
    const result = await dataSource.getRepository("Skill").delete(skillId);
    if (result.affected === 0) {
      next(appError(400, "ID錯誤"));
      return;
    }
    appSuccess(res, 200, null);
  },
};

module.exports = skillController;
