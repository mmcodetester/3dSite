const MonthlyAmount = require("../models/monthly.amount");
const Order = require("../models/order.model");
const CommandResult = require("../utils/helpers/command.result");
const NewOrderViewModel = require("../viewmodels/new.order.viewmodel");
const RepositoryBase = require("./common/repository.base");
const authService = require('../services/auth.service');
const OtherOrder = require("../models/other.order.model");
const OrderViewModel = require("../viewmodels/oerder.viewmodel");

const repo = new RepositoryBase(Order)
const monthlyAmountRepo = new RepositoryBase(MonthlyAmount)
const otherOrderRepo = new RepositoryBase(OtherOrder)
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
                                monthly_amount_id: monthlyAmount.id,
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

exports.BulkSave = async (req, res) => {
    let result = new CommandResult()
    try {
        let list = []
        const user = await authService.GetLoggedInUser(req)
        const monthlyFilter = {
            deleted: false,
            status: true,
        }
        const monthlyAmount = await monthlyAmountRepo.CustomQuery({ filter: monthlyFilter })
        if (monthlyAmount) {
            const orderList = []
            const otherOrderList = []
            list = req.body
            for (let data of list) {
                let order = {
                    id: data.id,
                    number: data.number,
                    amount: data.amount,
                    extra: data.extra
                }
                const orderFilter = {
                    deleted: false,
                    monthly_amount_id: monthlyAmount.id,
                    number_id: order.id
                }
                const totalOrder = await repo.GetSum({ field_name: 'amount', filter: orderFilter }) || 0
                const remain = monthlyAmount.amount - totalOrder;
                if (remain > 0) {
                    if (remain > order.amount) {
                        let vm = new NewOrderViewModel()
                        vm.id = null
                        vm.number_id = order.id
                        vm.month_id = monthlyAmount.month_id
                        vm.year = monthlyAmount.year
                        vm.created_by = user.id
                        vm.amount = order.amount
                        vm.extra = order.extra
                        vm.monthly_amount_id = monthlyAmount.id
                        vm.deleted = false
                        orderList.push(vm)
                        //result = await repo.save(vm)
                    } else {
                        let vm = new NewOrderViewModel()
                        vm.id = null
                        vm.number_id = order.id
                        vm.month_id = monthlyAmount.month_id
                        vm.year = monthlyAmount.year
                        vm.created_by = user.id
                        vm.amount = remain
                        vm.extra = order.extra
                        vm.monthly_amount_id = monthlyAmount.id
                        vm.deleted = false
                        //console.log(vm)
                        //result = await repo.save(vm)
                        orderList.push(vm)

                        let om = new NewOrderViewModel()
                        om.id = null
                        om.number_id = order.id
                        om.amount = order.amount - remain;
                        om.monthly_amount_id = monthlyAmount.id
                        om.extra = 0
                        om.created_by = user.id
                        om.deleted = false
                        if (om.amount > 0) {
                            otherOrderList.push(om)
                        }
                    }
                } else {
                    let om = new NewOrderViewModel()
                    om.id = null
                    om.number_id = order.id
                    om.amount = order.amount;
                    om.monthly_amount_id = monthlyAmount.id
                    om.extra = 0
                    om.created_by = user.id
                    om.deleted = false
                    // result = await otherOrderRepo.save(om)
                    otherOrderList.push(om)
                    if (order.extra && order.extra > 0) {
                        let vm = new NewOrderViewModel()
                        vm.id = null
                        vm.number_id = order.id
                        vm.month_id = monthlyAmount.month_id
                        vm.year = monthlyAmount.year
                        vm.created_by = user.id
                        vm.amount = 0
                        vm.extra = order.extra
                        vm.monthly_amount_id = monthlyAmount.id
                        vm.deleted = false
                        orderList.push(vm)
                        /// result = await repo.save(vm)
                    }
                }
                
            };
            result = await repo.bulkSave(orderList)
            if(result.success){
                result = await otherOrderRepo.bulkSave(otherOrderList)
            }
        }
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}
