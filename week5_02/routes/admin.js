const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isNotValidInteger, isNotValidString, isUndefined } = require('../utils/validUtils');
const { err400_isNotValid,err400_userNotExist,  err400_msg,err409_msg, success200, success201 } = require('../utils/response');

// 取得教練列表
router.get('/', async (req, res, next) => {
  try {
    const { per, page } = req.query
    const perPage = parseInt(per)
    const pageNum = parseInt(page)

    if (isNaN(perPage) || isNaN(pageNum)) {
      err400_isNotValid(res);
    }

    const newCoach = await dataSource.getRepository('Coach').find({
      take: perPage,
      skip: (perPage*(pageNum-1)),
      relations: ["User"]
    })

    const newData = newCoach.map((data)=>{
      return {
        id:data.User.id,
        name:data.User.name
      }
    })
    success200(res,newData)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 取得教練詳細資訊
router.get('/:coachId', async (req, res, next) => {
  try {
    const { coachId } = req.params
    if(isNotValidString(coachId)) {
      err400_isNotValid(res);
    }
    const userData = dataSource.getRepository("User")
    const findUser = await userData.findOne({
      where:{
        id:coachId
      }
    })
    if( !findUser ){
      err400_msg(res,"找不到該教練")
    }else if( findUser.role!=="COACH" ){
      err400_msg(res,"使用者非教練")
    }

    const coachData = dataSource.getRepository("Coach")
    const findData = await coachData.findOne({
      where:{
        user_id:coachId
      },
      relations: ['User']
    })

    const { User, id, user_id, experience_years, description, profile_image_url } = findData;
    const { name, role } = User;

    const result = {
      "user":{
        "name":name,
        "role":role
      },
      "coach" :{
        "id":id,
        "user_id":user_id,
        "experience_years":experience_years,
        "description":description,
        "profile_image_url":profile_image_url
      }
    }

    success200(res,result);

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//  新增教練課程資料
router.post('/coaches/courses', async (req, res, next) => {
  try {
    const { user_id, skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body
    if(isNotValidString(user_id) || isNotValidString(skill_id) || isNotValidString(name) || isNotValidString(description)
      || isNotValidString(start_at) || isNotValidString(end_at) || isNotValidInteger(max_participants)) {
      err400_isNotValid(res);
    }

    if(meeting_url && !isNotValidString(meeting_url) && !meeting_url.startsWith("https")){
      err400_isNotValid(res);
    }
    const userRepo = dataSource.getRepository("User")
    const findUser = await userRepo.findOne({
      where:{
        id: user_id
      }
    })
    if(!findUser){
      err400_userNotExist(res);
    }else if(findUser && findUser.role !=="COACH"){
      err400_msg(res,"使用者尚未成為教練")
    }
    const courseRepo = dataSource.getRepository("Course")
    const newCourse = courseRepo.create({
      user_id,
      skill_id,
      name,
      description,
      max_participants,
      start_at,
      end_at,
      meeting_url
    })
    const result = await courseRepo.save(newCourse)
    success201(res,{course: result})

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 將使用者新增為教練
router.put('/coaches/courses/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body
    if(isNotValidString(courseId) || isNotValidString(skill_id) || isNotValidString(name) || isNotValidString(description)
      || isNotValidString(start_at) || isNotValidString(end_at) || isNotValidInteger(max_participants)) {
        err400_isNotValid(res);
    }

    if(meeting_url && !isNotValidString(meeting_url) && !meeting_url.startsWith("https") ){
      err400_isNotValid(res);
    }

    const courseRepo = dataSource.getRepository("Course")
    const findCourse = await courseRepo.findOne({
      where:{
        id: courseId
      }
    })
    if(!findCourse){
      err400_msg(res,"課程不存在")
    }

    const updateCourse = await courseRepo.update({
      id:courseId
    },{
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url
    })
    if(updateCourse.affected === 0){
      err400_msg(res,"課程更新失敗")
    }

    const courseResult = await courseRepo.findOne({
      where:{
        id: courseId
      }
    })

    success201(res,{course: courseResult})

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.post('/coaches/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body;

    if (isNotValidString(userId) || isUndefined(userId) || isNotValidInteger(experience_years) || isNotValidString(description)){
      err400_isNotValid(res);
    }

    if(profile_image_url && !isNotValidString(profile_image_url) && !profile_image_url.startsWith("https")
      && !/\.(png|jpg)$/i.test(profile_image_url)){
      err400_isNotValid(res);
    }

    const userRepo = dataSource.getRepository("User")
    const findUser = await userRepo.findOne({
      where:{
        id:userId
      }
    })
    if(!findUser){
      err400_userNotExist(res);
    }else if(findUser.role === "COACH"){
      err409_msg(res,"使用者已是教練")
    }

    const updateUser = await userRepo.update({
      id: userId
    },{
      role: "COACH"
    })
    
    if(updateUser.affected === 0){
      err400_msg(res,"更新使用者失敗")
    }

    const coachRepo = dataSource.getRepository("COACH")
    const newCoach = coachRepo.create({
      user_id: userId,
      description,
      profile_image_url,
      experience_years
    })
    const coachResult = await coachRepo.save(newCoach)
    const userResult = await userRepo.findOne({
      where:{
        id:userId
      }
    })

    success201(res,{
      user: {
        name: userResult.name,
        role: userResult.role
      },
      coach: coachResult
    })

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router