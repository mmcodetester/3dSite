const MonthlyAmount = require("../../models/monthly.amount");
const OtherAmontReport = require("../../models/other.amount.report");
const OtherOrder = require("../../models/other.order.model");
const CommandResult = require("../../utils/helpers/command.result");
const PageResult = require("../../utils/helpers/page.result");
const NewOrderViewModel = require("../../viewmodels/new.order.viewmodel");
const OrderViewModel = require("../../viewmodels/oerder.viewmodel");
const WeeklyAmountViewModel = require("../../viewmodels/reports/weekly.amount.viewmodel");
const RepositoryBase = require("../common/repository.base");

const repo = new RepositoryBase(OtherAmontReport)
const otherOrderRepo = new RepositoryBase(OtherOrder)
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
exports.GetAllOtherOrderRecord = async (req, res) => {
    let result = new PageResult()
    try {
        const { monthly_amount_id, user_id, number, id, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let activeAmountId = monthly_amount_id;

        if (!activeAmountId) {
            activeAmountId = await GetActiveAmountId();
        }
        const filter = {
            deleted: false,
            status: false,
            monthly_amount_id: activeAmountId
        }
        if (number) {
            filter.number = number
        }
        const list = await otherOrderRepo.getAll({
            filter: filter,
            page: page,
            length: length,
            include: [
                {
                    association: 'number',
                    where: { deleted: false },
                    required: false,
                },
                {
                    association: 'monthly_amount',
                    where: { deleted: false },
                    required: false,
                    include: [
                        {
                            association: 'month',
                            where: { deleted: false },
                            required: false,
                        },
                    ]
                },
                {
                    association: 'user',
                    where: { deleted: false },
                    required: false,
                },
            ],
            sort: [sortBy, sortOrder],
        })
        if (list.total > 0) {
            list.data.forEach(element => {
                let vm = new WeeklyAmountViewModel()
                vm.id = element.id
                vm.total_amount = element.amount
                if (element.user) {
                    vm.username = element.user.name
                }
                if (element.number) {
                    vm.number = element.number.number
                }
                if (element.monthly_amount) {
                    vm.year = element.monthly_amount.year
                    vm.from_to = element.monthly_amount.from_day + "-" + element.monthly_amount.to_day
                    if (element.monthly_amount.month) {
                        vm.month_name = element.monthly_amount.month.month_name
                        //console.log( element.monthly_amount.month)

                    }
                }
                result.data.push(vm)
            });
        }
        result.total = list.total
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}
exports.ConfirmOrder = async (req, res) => {
    let result = new CommandResult()
    try {
        const { id } = req.query
        if (id > 0) {
            const data = await otherOrderRepo.getById({ id: id })
            if (data) {
                let om = new NewOrderViewModel()
                om.id = data.id
                om.number_id = data.number_id
                om.amount = data.amount;
                om.monthly_amount_id = data.monthly_amount_id
                om.extra = data.extra
                om.status = true
                om.created_by = data.created_by
                om.created_date = data.created_date
                om.updated_by = new Date()
                om.deleted = false
                result = await otherOrderRepo.save(om)
            }
        }
    } catch (e) {
        result.messages.push(e.message)
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