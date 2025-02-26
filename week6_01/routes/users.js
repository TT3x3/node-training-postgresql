const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const generateJWT = require('../utils/generateJWT') // 建立JWT方法
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret, // 傳預設值
  userRepository: dataSource.getRepository('User'), // 連接User資料庫
  logger
})

const { isNotValidString, isUndefined } = require('../utils/validUtils');
const { err400_isNotValid, err400_msg,err409_msg, success200, success201 } = require('../utils/response');

// 註冊
router.post('/signup', async (req, res, next) => {
  try {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    const { name, email, password } = req.body
    if (isUndefined(name) || isNotValidString(name) || isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      err400_isNotValid(res)
    }
    if (!passwordPattern.test(password)) {
      logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      err400_msg(res, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      where: { email }
    })

    if (existingUser) {
      logger.warn('建立使用者錯誤: Email 已被使用')
      err409_msg(res, {
        status: 'failed',
        message: 'Email 已被使用'
      })
    }
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)
    const newUser = userRepository.create({
      name,
      email,
      role: 'USER',
      password: hashPassword
    })

    const savedUser = await userRepository.save(newUser)
    logger.info('新建立的使用者ID:', savedUser.id)
    
    success201(res, {
      user: {
        id: savedUser.id,
        name: savedUser.name
      }
    })

  } catch (error) {
    logger.error('建立使用者錯誤:', error)
    next(error)
  }
})

// 登入
router.post('/login', async (req, res, next) => {
  try {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    const { email, password } = req.body
    if (isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      err400_isNotValid(res)
    }
    if (!passwordPattern.test(password)) {
      logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      err400_msg(res, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      select: ['id', 'name', 'password'],
      where: { email }
    })

    if (!existingUser) {
      err400_msg(res, "使用者不存在或密碼輸入錯誤")
    }
    logger.info(`使用者資料: ${JSON.stringify(existingUser)}`)
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
      err400_msg(res, "使用者不存在使用者不存在或密碼輸入錯誤或密碼輸入錯誤")
    }
    const token = generateJWT({
      id: existingUser.id
    }, config.get('secret.jwtSecret'), {
      expiresIn: `${config.get('secret.jwtExpiresDay')}`
    })

    success200(res, {
      token,
      user: {
        name: existingUser.name
      }
    })

  } catch (error) {
    logger.error('登入錯誤:', error)
    next(error)
  }
})

// 登入獲得個人資料(token)
router.get('/profile', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
      select: ['name', 'email'],
      where: { id }
    })
    success200(res, { user})

  } catch (error) {
    logger.error('取得使用者資料錯誤:', error)
    next(error)
  }
})

// 登入編輯個人資料
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { name } = req.body
    if (isUndefined(name) || isNotValidString(name)) {
      logger.warn('欄位未填寫正確')
      err400_isNotValid(res)
    }
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
      select: ['name'],
      where: {
        id
      }
    })
    if (user.name === name) {
      err400_msg(res, "使用者名稱未變更")
    }
    const updatedResult = await userRepository.update({
      id,
      name: user.name
    }, {
      name
    })
    if (updatedResult.affected === 0) {
      err400_msg(res, "更新使用者資料失敗")
    }
    const result = await userRepository.findOne({
      select: ['name'],
      where: {
        id
      }
    })

    success200(res, result)

  } catch (error) {
    logger.error('取得使用者資料錯誤:', error)
    next(error)
  }
})

module.exports = router