const MonthlyAmount = require("../../models/monthly.amount");
const OtherAmontReport = require("../../models/other.amount.report");
const OtherOrder = require("../../models/other.order.model");
const PageResult = require("../../utils/helpers/page.result");
const RepositoryBase = require("../common/repository.base");

const repo = new RepositoryBase(OtherAmontReport)
const monthlyAmountRepo = new RepositoryBase(MonthlyAmount)
const GetActiveAmountId = async () => {
    let id = null
    try {
        const filter = {
            deleted: false,
            status: true
        }
        const data = await monthlyAmountRepo.CustomQuery({ filter: filter })
        if (data) {
            id = data.id
        }
    } catch (e) {
        console.log(e)
    }
    return id
}

exports.GetAll = async (req, res) => {
    let result = new PageResult()
    try {
        const { monthly_amount_id, user_id, number, id, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let activeAmountId = monthly_amount_id;

        if (!activeAmountId) {
            activeAmountId = await GetActiveAmountId();
        }
        const filter = {
            monthly_amount_id: activeAmountId
        }
        if (number) {
            filter.number = number
        }
        result = await repo.getAll({
            filter: filter,
            page: page,
            length: length,
            sort: [sortBy, sortOrder],
        })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

exports.GetTotal = async (req, res) => {
    let result = {
        total: 0,
        extra: 0
    }
    try {
        const { monthly_amount_id, user_id, number, id, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query

        let activeAmountId = monthly_amount_id;

        if (!activeAmountId) {
            activeAmountId = await GetActiveAmountId();
        }
        const filter = {
            monthly_amount_id: activeAmountId
        }
        if (number) {
            filter.number = number
        }
        result.total = await repo.GetSum({ field_name: 'total_amount', filter: filter })
        result.extra = await repo.GetSum({ field_name: 'total_extra', filter: filter })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}