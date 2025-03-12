const appSuccess = (res, status, data) => {
    res.status(status).json({
        status: 'success',
        data
    });
    return
};

module.exports = appSuccess;