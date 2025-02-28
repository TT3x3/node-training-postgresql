const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Skill')
const { isInvalidString } = require('../utils/validUtils');
const appError = require("../utils/appError")
const appSuccess = require("../utils/appSuccess")

// 取得所有教練技能
router.get('/', async (req, res, next) => {
    try {
        const data = await dataSource.getRepository("Skill").find({
          select: ["id", "name"]
        })
        appSuccess(res, 200, data)
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

// 新增教練技能
router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body;
        if ( isInvalidString(name) ) {
          next(appError(400, "欄位未正確填寫"))
        }
        const skillRepo = dataSource.getRepository("Skill")
        const findSkill = await skillRepo.find({
          where: {
            name
          }
        })
        if (findSkill.length > 0) {
          next(appError(409, "資料重複"))
        }
        const newSkill = skillRepo.create({
          name
        })
        const result = await skillRepo.save(newSkill)
          appSuccess(res, 201, result)
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

// 刪除教練技能
router.delete('/:skillId', async (req, res, next) => {
    try {
        const { skillId } = req.params
        if ( isInvalidString(skillId) ) {
          next(appError(400, "ID錯誤"))
        }
        const result = await dataSource.getRepository("Skill").delete(skillId)
        if (result.affected === 0) {
          next(appError(400, "ID錯誤"))
        }
        appSuccess(res, 200, null)

      } catch (error) {
        logger.error(error)
        next(error)
      }
})

module.exports = router