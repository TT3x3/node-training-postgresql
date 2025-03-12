const express = require("express");

const router = express.Router();
const config = require("../config/index");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Course");
const auth = require("../middlewares/auth")({
  secret: config.get("secret").jwtSecret,
  userRepository: dataSource.getRepository("User"),
  logger,
});

const handleErrorAsync = require("../utils/handleErrorAsync");
const courseController = require("../controllers/course");

// 取得課程列表
router.get("/", handleErrorAsync(courseController.getCourses));

// 報名課程
router.post("/:courseId", auth, handleErrorAsync(courseController.postCourse));

// 刪除課程
router.delete(
  "/:courseId", auth,handleErrorAsync(courseController.deleteCourse));

module.exports = router;
