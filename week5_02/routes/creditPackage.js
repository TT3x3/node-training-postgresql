const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const { isNotValidInteger, isNotValidString, isUndefined } = require('../utils/validUtils');
const { err400_isNotValid, err400_idErr, success200, err409_duplicateData} = require('../utils/response');

// 取得所有課堂資料
router.get('/', async (req, res, next) => {
    try {
        const data = await dataSource.getRepository("CreditPackage").find({
          select: ["id", "name", "credit_amount", "price"]
        })
        success200(res,data)
      } catch (error) {
        logger.error(error)
        next(error);
      }
})

// 新增課堂資料
router.post('/', async (req, res, next) => {
    try {
        const { name, credit_amount, price } = req.body;
        if (isUndefined(name) || isNotValidString(name )|| isNotValidInteger(credit_amount) || isNotValidInteger(price)) {
            err400_isNotValid(res)
        }
        const creditPackageRepo = dataSource.getRepository("CreditPackage");
        const findCreditPackage = await creditPackageRepo.find({
            where: {
                name:name
            }
        })
    
        if (findCreditPackage.length > 0) {
            err409_duplicateData(res)
          }
          const newPackage = await creditPackageRepo.create({
            name,
            credit_amount,
            price
        })

        const result = await creditPackageRepo.save(newPackage);
        success200(res,{
            status: "success",
            data: result
        })
      } catch (error) {
        logger.error(error)
        next(error)
      }
})

// 刪除指定課堂資料
router.delete('/:packageId', async (req, res, next) => {
    try {
        const { packageId } = req.params;
        if (isUndefined(packageId) || isNotValidString(packageId)) {
            err409_duplicateData(res)
        }

        const result = await dataSource.getRepository("CreditPackage").delete(packageId)
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
