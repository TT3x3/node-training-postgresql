const express = require('express')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})

const { isInvalidString, isInvalidInteger } = require('../utils/validUtils');
const appError = require("../utils/appError")
const appSuccess = require("../utils/appSuccess")

// 取得組合方案列表
router.get('/', async (req, res, next) => {
  try {
    const creditPackage = await dataSource.getRepository('CreditPackage').find({
      select: ['id', 'name', 'credit_amount', 'price']
    })
    
    appSuccess(res, 200, creditPackage)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 新增組合方案
router.post('/', async (req, res, next) => {
  try {
    const { name, credit_amount: creditAmount, price } = req.body
    if ( isInvalidString(name) || isInvalidInteger(creditAmount) || isInvalidInteger(price) ){
      next(appError(400, "欄位未填寫正確"))
    }
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const existCreditPackage = await creditPackageRepo.find({
      where: {
        name
      }
    })
    if (existCreditPackage.length > 0) {
      next(appError(409, "資料重複"))
    }
    const newCreditPurchase = creditPackageRepo.create({
      name,
      credit_amount: creditAmount,
      price
    })
    const result = await creditPackageRepo.save(newCreditPurchase)
    
    appSuccess(res, 200, result)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 登入後購買方案
router.post('/:creditPackageId', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { creditPackageId } = req.params
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const creditPackage = await creditPackageRepo.findOne({
      where: {
        id: creditPackageId
      }
    })
    if (!creditPackage) {
      next(appError(400, "ID錯誤"))
    }
    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
    const newPurchase = await creditPurchaseRepo.create({
      user_id: id,
      credit_package_id: creditPackageId,
      purchased_credits: creditPackage.credit_amount,
      price_paid: creditPackage.price,
      purchaseAt: new Date().toISOString()
    })
    await creditPurchaseRepo.save(newPurchase)

    appSuccess(res, 200, null)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 刪除組合方案
router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    const { creditPackageId } = req.params
    if ( isInvalidString(creditPackageId) ) {
      next(appError(400, "欄位未填寫正確"))
    }
    const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId)
    if (result.affected === 0) {
      next(appError(400, "ID錯誤"))
    }
    appSuccess(res, 200, result)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router