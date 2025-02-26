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

const { isNotValidInteger, isNotValidString, isUndefined } = require('../utils/validUtils');
const { err400_isNotValid, err400_idErr, err409_duplicateData, success200 } = require('../utils/response');


// 取得組合包
router.get('/', async (req, res, next) => {
  try {
    const creditPackage = await dataSource.getRepository('CreditPackage').find({
      select: ['id', 'name', 'credit_amount', 'price']
    })
    
    success200(res, creditPackage)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 新增組合包
router.post('/', async (req, res, next) => {
  try {
    const { name, credit_amount: creditAmount, price } = req.body
    if (isUndefined(name) || isNotValidString(name) ||
      isUndefined(creditAmount) || isNotValidInteger(creditAmount) ||
            isUndefined(price) || isNotValidInteger(price)) {

      err400_isNotValid(res)
    }
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const existCreditPackage = await creditPackageRepo.find({
      where: {
        name
      }
    })
    if (existCreditPackage.length > 0) {
      err409_duplicateData(res)
    }
    const newCreditPurchase = await creditPackageRepo.create({
      name,
      credit_amount: creditAmount,
      price
    })
    const result = await creditPackageRepo.save(newCreditPurchase)
    
    success200(res, result)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 登入後購買組合包
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
      err400_idErr(res)
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

    success200(res, null)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

// 刪除組合包
router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    const { creditPackageId } = req.params
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
      err400_isNotValid(res)
    }
    const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId)
    if (result.affected === 0) {
      err400_idErr(res)
    }
    success200(res, result)

  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router