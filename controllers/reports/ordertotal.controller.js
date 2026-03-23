const { Op } = require("sequelize")
const Order = require("../../models/order.model")
const OrderTotalViewModel = require("../../viewmodels/ordertotal.viewmodel")
const RepositoryBase = require("../common/repository.base")
const { startOfMonth, endOfMonth } = require('date-fns');
const repo = new RepositoryBase(Order)
const moment = require('moment')
exports.Get = async (req, res) => {
    let vm = new OrderTotalViewModel()
    try {
        let todayfilter = {
            deleted: false,
            created_date: new Date()
        }

        vm.today_total = await repo.GetSum({ field_name: 'amount', filter: todayfilter })
        let yearfilter = {
            deleted: false,
            year: new Date().getFullYear()
        }
        vm.yearly_total = await repo.GetSum({ field_name: 'amount', filter: yearfilter })

        const today = new Date();
        const thisMonthFilter = {
            deleted: false,
            created_date: {
                [Op.between]: [startOfMonth(today), endOfMonth(today)]
            }
        };
        vm.monthly_total = await repo.GetSum({ field_name: 'amount', filter: thisMonthFilter })
        

    } catch (e) {
        console.log(e)
    }
    res.json(vm)
}