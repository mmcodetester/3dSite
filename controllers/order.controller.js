const MonthlyAmount = require("../models/monthly.amount");
const Order = require("../models/order.model");
const CommandResult = require("../utils/helpers/command.result");
const NewOrderViewModel = require("../viewmodels/new.order.viewmodel");
const RepositoryBase = require("./common/repository.base");
const authService = require('../services/auth.service')

const repo = new RepositoryBase(Order)
const monthlyAmountRepo = new RepositoryBase(MonthlyAmount)

exports.Save = async (req, res) => {
    let result = new CommandResult()
    let fullOrder = []
    let list = []
    try {
        let dataList = {
            data: [],
            total: 0
        }
        const user = await authService.GetLoggedInUser(req)
        if (user) {
            const year = new Date().getFullYear()
            const month = new Date().getMonth() + 1
            const monthlyFilter = {
                deleted: false,
                year: year,
                status: true,
            }
            const monthlyAmount = await monthlyAmountRepo.CustomQuery({ filter: monthlyFilter })
            if (monthlyAmount) {
                dataList = req.body
                if (dataList.total > 0) {
                    if (dataList.data.length > 0) {
                        for (const data of dataList.data) {
                            const orderFilter = {
                                deleted: false,
                                year: year,
                                monthly_amount_id : monthlyAmount.id,
                                number_id: data.number_id
                            }
                            const totalOrder = await repo.GetSum({ field_name: 'amount', filter: orderFilter }) || 0
                            const remain = monthlyAmount.amount - totalOrder;
                            if (remain >= data.amount) {
                                const remain = totalOrder - data.amount
                                let vm = new NewOrderViewModel()
                                vm.month_id = month
                                vm.year = year
                                vm.number_id = data.number_id
                                vm.monthly_amount_id = monthlyAmount.id,
                                vm.amount = data.amount
                                vm.created_by = user.id
                                vm.extra = data.extra
                                vm.date = new Date()
                                list.push(vm)
                            } else {
                                fullOrder.push(data.number)
                            }
                        }
                        if (fullOrder.length > 0) {
                            result.success = false;

                            const msg = `${fullOrder.join(', ')} cannot save. Amount is full.`;

                            result.message = msg;
                        } else {
                            for (const data of list) {
                                result = await repo.save(data)
                            }

                        }
                    }
                }
            }
        }
    } catch (e) {
        result.success = false
        result.messages.push(e)
    }
    res.json(result)
}
