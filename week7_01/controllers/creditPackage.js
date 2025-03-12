const { dataSource } = require("../db/data-source");

const { isInvalidString, isInvalidInteger } = require("../utils/validUtils");
const appError = require("../utils/appError");
const appSuccess = require("../utils/appSuccess");

const creditPackageController = {
  async getCreditPackages(req, res, next) {
    const creditPackage = await dataSource.getRepository("CreditPackage").find({
      select: ["id", "name", "credit_amount", "price"],
    });
    appSuccess(res, 200, creditPackage);
  },
  async postCreditPackage(req, res, next) {
    const { name, credit_amount: creditAmount, price } = req.body;
    if (
      isInvalidString(name) ||
      isInvalidInteger(creditAmount) ||
      isInvalidInteger(price)
    ) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const creditPackageRepo = dataSource.getRepository("CreditPackage");
    const existCreditPackage = await creditPackageRepo.find({
      where: {
        name,
      },
    });
    if (existCreditPackage.length > 0) {
      next(appError(409, "資料重複"));
      return;
    }
    const newCreditPurchase = creditPackageRepo.create({
      name,
      credit_amount: creditAmount,
      price,
    });
    const result = await creditPackageRepo.save(newCreditPurchase);

    appSuccess(res, 200, result);
  },
  async postCreditPackageId(req, res, next) {
    const { id } = req.user;
    const { creditPackageId } = req.params;
    const creditPackageRepo = dataSource.getRepository("CreditPackage");
    const creditPackage = await creditPackageRepo.findOne({
      where: {
        id: creditPackageId,
      },
    });
    if (!creditPackage) {
      next(appError(400, "ID錯誤"));
      return;
    }
    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");
    const newPurchase = await creditPurchaseRepo.create({
      user_id: id,
      credit_package_id: creditPackageId,
      purchased_credits: creditPackage.credit_amount,
      price_paid: creditPackage.price,
      purchaseAt: new Date().toISOString(),
    });
    await creditPurchaseRepo.save(newPurchase);

    appSuccess(res, 200, null);
  },
  async deleteCreditPackage(req, res, next) {
    const { creditPackageId } = req.params;
    if (isInvalidString(creditPackageId)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const result = await dataSource
      .getRepository("CreditPackage")
      .delete(creditPackageId);
    if (result.affected === 0) {
      next(appError(400, "ID錯誤"));
      return;
    }
    appSuccess(res, 200, result);
  },
};

module.exports = creditPackageController;
