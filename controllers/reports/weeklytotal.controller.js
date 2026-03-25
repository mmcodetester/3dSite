const MonthlyAmount = require("../../models/monthly.amount")
const WeeklyTotal = require("../../models/weeklytotal.model")
const PageResult = require("../../utils/helpers/page.result")
const RepositoryBase = require("../common/repository.base")

const repo = new RepositoryBase(WeeklyTotal)
const montlyAmountRepo = new RepositoryBase(MonthlyAmount)
const GetActiveAmountId = async () => {
    let id = null
    try {
        const filter = {
            deleted: false,
            status: true
        }
        const data = await montlyAmountRepo.CustomQuery({ filter: filter })
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
        const { monthly_amount_id, number, date, created_by, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let filter = {
            monthly_amount_id: monthly_amount_id ?? await GetActiveAmountId()
        }
        if (number) {
            filter.number = number
        }
        result = await repo.getAll({ filter: filter })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

exports.GetTotal = async (req, res) => {
    let result = 0
    try {
        const { monthly_amount_id, number, date, created_by, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let activeAmountId = monthly_amount_id;

        if (!activeAmountId) {
            activeAmountId = await GetActiveAmountId();
        }

        let filter = {
            monthly_amount_id: activeAmountId
        }
        if (number) {
            filter.number = number
        }
        result = await repo.GetSum({ field_name: 'total_amount', filter: filter })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

