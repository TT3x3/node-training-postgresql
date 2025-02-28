
const isValidPassword = (value) => {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    return passwordPattern.test(value);
}

const isValidName = (value) => {
    const namePattern = /^[a-zA-Z0-9]{2,10}$/
    return namePattern.test(value);
}

const isInvalidString = (value) => {
    return value === undefined || typeof value !== "string" || value.trim().length === 0;
};

const isInvalidInteger = (value) => {
    return typeof value !== "number" || value < 0 || value % 1 !== 0
};

module.exports= { isValidPassword, isValidName, isInvalidString, isInvalidInteger } ;