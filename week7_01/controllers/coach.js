const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Admin");

const { isInvalidString } = require("../utils/validUtils");
const appError = require("../utils/appError");
const appSuccess = require("../utils/appSuccess");

const coachController = {
  async getCoaches(req, res, next) {
    const { per, page } = req.query;
    const perPage = parseInt(per);
    const pageNum = parseInt(page);

    if (
      isNaN(perPage) ||
      perPage % 1 !== 0 ||
      isNaN(pageNum) ||
      pageNum % 1 !== 0
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未正確填寫"));
      return;
    }

    const newCoach = await dataSource.getRepository("Coach").find({
      take: perPage,
      skip: perPage * (pageNum - 1),
      relations: ["User"],
    });

    const newData = newCoach.map((data) => {
      return {
        id: data.User.id,
        name: data.User.name,
      };
    });
    appSuccess(res, 200, newData);
  },
  async getCoachId(req, res, next) {
    const { coachId } = req.params;
    if (isInvalidString(coachId)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const findCoach = await dataSource
      .getRepository("Coach")
      .findOneBy({ id: coachId });

    if (!findCoach) {
      logger.warn("找不到該教練ID");
      next(appError(400, "ID錯誤"));
      return;
    }

    const findUser = await dataSource.getRepository("User").findOne({
      select: ["name", "role"],
      where: { id: findCoach.user_id },
    });
    const { name, role } = findUser;
    const {
      id,
      user_id,
      experience_years,
      description,
      profile_image_url,
      created_at,
      update_at,
    } = findCoach;

    const result = {
      user: {
        name: name,
        role: role,
      },
      coach: {
        id: id,
        user_id: user_id,
        experience_years: experience_years,
        description: description,
        profile_image_url: profile_image_url,
        created_at: created_at,
        update_at: update_at,
      },
    };

    appSuccess(res, 200, result);
  },
};

module.exports = coachController;
