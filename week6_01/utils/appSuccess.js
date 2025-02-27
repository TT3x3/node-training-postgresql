// const appSuccess = (status, appData, next) => {
//     const success = new success(appData);
//     success.status = status;
//     return success;
// }

// module.exports = appSuccess;

const appSuccess = (res, status, data) => {
    res.status(status).json({
        status: 'success',
        data
    });
    return
};

module.exports = appSuccess;