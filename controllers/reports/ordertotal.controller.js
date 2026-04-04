const { Op } = require("sequelize")
const Order = require("../../models/order.model")
const OrderTotalViewModel = require("../../viewmodels/ordertotal.viewmodel")
const RepositoryBase = require("../common/repository.base")
const MonthlyAmount = require("../../models/monthly.amount");
const { startOfMonth, endOfMonth } = require('date-fns');
const repo = new RepositoryBase(Order)
const monthlyAmountRepo = new RepositoryBase(MonthlyAmount)
const moment = require('moment');

exports.Get = async (req, res) => {
    let vm = new OrderTotalViewModel()
    try {
        let todayfilter = {
            deleted: false,
            created_date: new Date()
        }

        vm.today_total = await repo.GetSum({ field_name: 'amount', filter: todayfilter })
        vm.today_extra_total = await repo.GetSum({ field_name: 'extra', filter: todayfilter })
        let yearfilter = {
            deleted: false,
            year: new Date().getFullYear()
        }
        vm.yearly_total = await repo.GetSum({ field_name: 'amount', filter: yearfilter }) ?? 0
        vm.yearly_total += await repo.GetSum({ field_name: 'extra', filter: yearfilter }) ?? 0
        const today = new Date();
        
        const monthlyAmountFilter = {
            deleted : false,
            month_id : new Date().getMonth() +1 
        }
        
        vm.monthly_total = await repo.GetSum({ field_name: 'amount', filter: monthlyAmountFilter }) ?? 0
        vm.monthly_total +=await repo.GetSum({ field_name: 'extra', filter: monthlyAmountFilter }) ?? 0
    } catch (e) {
        console.log(e)
    }
    res.json(vm)
}