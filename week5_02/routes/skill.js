const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Skill')
const { isNotValidString, isUndefined } = require('../utils/validUtils');
const { err400_isNotValid, err400_idErr, success200, success201, err409_duplicateData, success201 } = require('../utils/response');

// 取得所有教練技能
router.get('/', async (req, res, next) => {
    try {
        const data = await dataSource.getRepository("Skill").find({
          select: ["id", "name"]
        })
        success200(res,data)
        
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

// 新增教練技能
router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body;
        if (isUndefined(name) || isNotValidString(name)) {
          err400_isNotValid(res)
        }
        const skillRepo = dataSource.getRepository("Skill")
        const findSkill = await skillRepo.find({
          where: {
            name
          }
        })
        if (findSkill.length > 0) {
          err409_duplicateData(res)
        }
        const newSkill = skillRepo.create({
          name
        })
        const result = await skillRepo.save(newSkill)
        success201(res,result)

      } catch (error) {
        logger.error(error)
        next(error)
      }
})

// 刪除教練技能
router.delete('/:skillId', async (req, res, next) => {
    try {
        const { skillId } = req.params
        if ( isNotValidString(skillId) ) {
          err400_idErr(res)
        }
        const result = await dataSource.getRepository("Skill").delete(skillId)
        if (result.affected === 0) {
          err400_idErr(res)
        }
        success200(res,[])

      } catch (error) {
        logger.error(error)
        next(error)
      }
})

module.exports = router