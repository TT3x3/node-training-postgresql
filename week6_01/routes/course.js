const express = require('express')
const { IsNull } = require('typeorm')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})

const { err400_idErr, err400_msg, success200, success201 } = require('../utils/response');


router.get('/', async (req, res, next) => {
  try {
    const courses = await dataSource.getRepository('Course').find({
      select: {
        id: true,
        name: true,
        description: true,
        start_at: true,
        end_at: true,
        max_participants: true,
        User: {
          name: true
        },
        Skill: {
          name: true
        }
      },
      relations: {
        User: true,
        Skill: true
      }
    })

    success200(res, courses.map((course) => {
      return {
        id: course.id,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        coach_name: course.User.name,
        skill_name: course.Skill.name
      }
    }))

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 預約課程
router.post('/:courseId', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { courseId } = req.params
    const courseRepo = dataSource.getRepository('Course')
    const course = await courseRepo.findOne({
      where: {
        id: courseId
      }
    })
    if (!course) {
      err400_idErr(res)
    }
    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
    const courseBookingRepo = dataSource.getRepository('CourseBooking')
    const userCourseBooking = await courseBookingRepo.findOne({
      where: {
        user_id: id,
        course_id: courseId
      }
    })
    if (userCourseBooking) {
      err400_msg(res, "已經報名過此課程")
    }
    const userCredit = await creditPurchaseRepo.sum('purchased_credits', {
      user_id: id
    })
    const userUsedCredit = await courseBookingRepo.count({
      where: {
        user_id: id,
        cancelledAt: IsNull()
      }
    })
    const courseBookingCount = await courseBookingRepo.count({
      where: {
        course_id: courseId,
        cancelledAt: IsNull()
      }
    })
    if (userUsedCredit >= userCredit) {
      err400_msg(res,"已無可使用堂數")

    } else if (courseBookingCount >= course.max_participants) {
      err400_msg(res,"已達最大參加人數，無法參加")

    }
    const newCourseBooking = await courseBookingRepo.create({
      user_id: id,
      course_id: courseId
    })
    await courseBookingRepo.save(newCourseBooking)

    success201(res, null)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 取消預約
router.delete('/:courseId', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { courseId } = req.params
    const courseBookingRepo = dataSource.getRepository('CourseBooking')
    const userCourseBooking = await courseBookingRepo.findOne({
      where: {
        user_id: id,
        course_id: courseId,
        cancelledAt: IsNull()
      }
    })
    if (!userCourseBooking) {
      err400_idErr(res)
    }
    const updateResult = await courseBookingRepo.update(
      {
        user_id: id,
        course_id: courseId,
        cancelledAt: IsNull()
      },
      {
        cancelledAt: new Date().toISOString()
      }
    )
    if (updateResult.affected === 0) {
      err400_msg(res,"取消失敗")
    }

    success200(res, null)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router