const MonthlyAmount = require("../../models/monthly.amount")
const WeeklyTotal = require("../../models/weeklytotal.model")
const PageResult = require("../../utils/helpers/page.result")
const WeeklyAmountViewModel = require("../../viewmodels/reports/weekly.amount.viewmodel")
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
        const data = await montlyAmountRepo.CustomQuery({
            filter: filter
        })
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
    let list = new PageResult()
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

        list = await repo.getAll({
            filter: filter,
            page: page,
            length: length,
            order:[sortBy, sortOrder],
            include: [
                {
                    association: 'monthly_amount',
                    where: { deleted: false },
                    required: false,
                    include: [
                        {
                            association: 'month',
                            where: { deleted: false },
                            required: false,
                        }
                    ]
                },
            ]
        })
        result.total = list.total
        if(list.total >0 ){
            list.data.forEach((data)=>{
                let vm =new WeeklyAmountViewModel()
                vm.id = data.id
                vm.number = data.number
                vm.total_amount = data.total_amount
                vm.total_extra = data.total_extra
                vm.monthly_amount_id = data.monthly_amount_id
                vm.from_to = data.from_to
                if(data.monthly_amount){
                    vm.year = data.monthly_amount.year
                    if(data.monthly_amount.month){
                        vm.month_name = data.monthly_amount.month.month_name
                    }
                }
                result.data.push(vm)
            })
        }
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

exports.GetTotal = async (req, res) => {
    let result = {
        total: 0,
        extra:0
    }
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
        result.total = await repo.GetSum({ field_name: 'total_amount', filter: filter })
        result.extra = await repo.GetSum({ field_name: 'total_extra', filter: filter })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

