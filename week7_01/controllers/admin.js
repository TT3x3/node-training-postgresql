const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Admin");

const { isInvalidString, isInvalidInteger } = require("../utils/validUtils");
const appError = require("../utils/appError");
const appSuccess = require("../utils/appSuccess");

const adminController = {
  async postAdminCourses(req, res, next) {
    const { id } = req.user;
    const {
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = req.body;
    if (
      isInvalidString(id) ||
      isInvalidString(skillId) ||
      isInvalidString(name) ||
      isInvalidString(description) ||
      isInvalidString(startAt) ||
      isInvalidString(endAt) ||
      isInvalidInteger(maxParticipants) ||
      isInvalidString(meetingUrl) ||
      !meetingUrl.startsWith("https")
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未正確填寫"));
      return;
    }

    const courseRepo = dataSource.getRepository("Course");
    const newCourse = courseRepo.create({
      user_id: id,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    });
    const savedCourse = await courseRepo.save(newCourse);
    const course = await courseRepo.findOneBy({ id: savedCourse.id });

    appSuccess(res, 200, course);
  },
  async putAdmin(req, res, next) {
    const { id } = req.user;
    const { courseId } = req.params;
    const {
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = req.body;
    if (
      isInvalidString(courseId) ||
      isInvalidString(skillId) ||
      isInvalidString(name) ||
      isInvalidString(description) ||
      isInvalidString(startAt) ||
      isInvalidString(endAt) ||
      isInvalidInteger(maxParticipants) ||
      isInvalidString(meetingUrl) ||
      !meetingUrl.startsWith("https")
    ) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未正確填寫"));
      return;
    }
    const courseRepo = dataSource.getRepository("Course");
    const existingCourse = await courseRepo.findOne({
      where: { id: courseId, user_id: id },
    });
    if (!existingCourse) {
      logger.warn("課程不存在");
      next(appError(400, "課程不存在"));
      return;
    }
    const updateCourse = await courseRepo.update(
      {
        id: courseId,
      },
      {
        skill_id: skillId,
        name,
        description,
        start_at: startAt,
        end_at: endAt,
        max_participants: maxParticipants,
        meeting_url: meetingUrl,
      }
    );
    if (updateCourse.affected === 0) {
      logger.warn("更新課程失敗");
      next(appError(400, "更新課程失敗"));
      return;
    }
    const savedCourse = await courseRepo.findOneBy({ id: courseId });

    appSuccess(res, 201, savedCourse);
  },
  async postAdminAsCoach(req, res, next) {
    const { userId } = req.params;
    const {
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl = null,
    } = req.body;
    if (isInvalidInteger(experienceYears) || isInvalidString(description)) {
      logger.warn("欄位未填寫正確");
      next(appError(400, "欄位未正確填寫"));
      return;
    }
    if (
      !isInvalidString(profileImageUrl) &&
      !profileImageUrl.startsWith("https")
    ) {
      logger.warn("大頭貼網址錯誤");
      next(appError(400, "大頭貼網址錯誤"));
      return;
    }
    const userRepository = dataSource.getRepository("User");
    const existingUser = await userRepository.findOne({
      select: ["id", "name", "role"],
      where: { id: userId },
    });
    if (!existingUser) {
      logger.warn("使用者不存在");
      next(appError(400, "使用者不存在"));
      return;
    } else if (existingUser.role === "COACH") {
      logger.warn("使用者已經是教練");
      next(appError(409, "使用者已是教練"));
      return;
    }
    const coachRepo = dataSource.getRepository("Coach");
    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl,
    });
    const updatedUser = await userRepository.update(
      {
        id: userId,
        role: "USER",
      },
      {
        role: "COACH",
      }
    );
    if (updatedUser.affected === 0) {
      logger.warn("更新使用者失敗");
      next(appError(400, "更新使用者失敗"));
      return;
    }
    const savedCoach = await coachRepo.save(newCoach);
    const savedUser = await userRepository.findOne({
      select: ["name", "role"],
      where: { id: userId },
    });

    appSuccess(res, 201, {
      user: savedUser,
      coach: savedCoach,
    });
  },
};

module.exports = adminController;
