const responses = {
    err400_isNotValid: (res)=>{
        res.status(400).json({
            status: 'failed',
            message: '欄位未填寫正確'
        })
        return
    },
    err400_userNotExist: (res)=>{
        res.status(400).json({
            status: 'failed',
            message: '使用者不存在'
        })
        return
    },
    err400_idErr: (res)=>{
        res.status(400).json({
            status: 'failed',
            message: 'ID錯誤'
        })
        return
    },
    err409_duplicateData: (res)=>{
        res.status(409).json({
            status: 'failed',
            message: '資料重複'
        })
        return
    },
    err400_msg: (res,msg)=>{
        res.status(400).json({
            status: 'failed',
            message: msg
        })
        return
    },
    err409_msg: (res,msg)=>{
        res.status(409).json({
            status: 'failed',
            message: msg
        })
        return
    },
    success200: (res,data)=>{
        res.status(200).json({
            status: 'success',
            data
          })
        return
    },
    success201: (res, data) => {
        res.status(201).json({
          status: 'success',
          data
        })
        return
      }
}

module.exports = responses;