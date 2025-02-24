const express = require('express');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Skill');
const { isNotValidString, isUndefined, isValidPassword } = require('../utils/validUtils');
const { err400_isNotValid, err400_msg, err409_msg, success201 } = require('../utils/response');

// 註冊使用者
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        if(isUndefined(name) || isNotValidString(name) || isUndefined(email) || isNotValidString(email) || isUndefined(password)){
          err400_isNotValid(res)
        }
        if(!isValidPassword(password)){
          err400_msg(res,"密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字")
        }
        const userRepo = dataSource.getRepository("User");
        const findUser = await userRepo.findOne({
            where: {
              email
            }
          });
        if(findUser){
          err409_msg(res,"Email已被使用")
        }
        
        const hashPassword = await bcrypt.hash(password, saltRounds);
        const newUser = userRepo.create({
          name,
          password:hashPassword,
          email,
          role:"USER"
        });
        const result = await userRepo.save(newUser);

        success201(res,{
          user:result.id,
          name: result.name
      })
      
    } catch (error) {
     logger.error(error)
     next(error)
    }
 });
 
 module.exports = router;