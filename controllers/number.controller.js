const { Op, Sequelize } = require('sequelize')
const Number = require("../models/number.model")
const RepositoryBase = require("./common/repository.base")
const OrderViewModel = require("../viewmodels/oerder.viewmodel")
const MonthlyAmount = require("../models/monthly.amount")
const orderStatusEnum = require("../utils/order.status.enum")
const Order = require("../models/order.model")


const repo = new RepositoryBase(Number)
const monthlyAmountRepo = new RepositoryBase(MonthlyAmount)
const orderRepo = new RepositoryBase(Order)

exports.InitNumber = async () => {
    const filter = {
        deleted: false
    }
    const count = await repo.GetCount({ filter: filter })
    if (count <= 0) {
        for (let i = 0; i <= 999; i++) {
            let data = {
                id: null,
                number: i.toString().padStart(3, '0'),
                deleted: false
            }
            await repo.save(data)
        }
    }
}

// exports.GetAll = async (req, res) => {
//     let result = []
//     try {
//         let list = []
//         const number = req.query.number
//         let filter = {
//             deleted: false
//         }
//         if (number && number != 'null') {
//             filter.number = {
//                 [Op.like]: `%${number}%`
//             }
//         }

//         const year = new Date().getFullYear()
//         const month = new Date().getMonth() + 1
//         const monthlyFilter = {
//             deleted: false,
//             year: year,
//             month_id: month
//         }
//         const monthlyAmount = await monthlyAmountRepo.CustomQuery({ filter: monthlyFilter })
//         if (monthlyAmount) {
//             list = await repo.CustomQueryFindAll({ filter: filter })
//             if (list && list.length > 0) {
//                 for (const data of list) {
//                     const orderFilter = {
//                         deleted: false,
//                         year: year,
//                         month_id: month,
//                         number_id : data.id
//                     }

//                     const totalOrder = await orderRepo.GetSum( {field_name:'amount',  filter: orderFilter }) || 0
//                     console.log(totalOrder, data.number, data.id, month)
//                     let vm = new OrderViewModel()
//                     vm.id = data.id
//                     vm.number = data.number
//                     vm.total_amount = monthlyAmount.amount
//                     vm.avaliable = monthlyAmount.amount - totalOrder
//                     vm.status = monthlyAmount.amount > totalOrder
//                         ? orderStatusEnum.Available
//                         : orderStatusEnum.Full

//                     result.push(vm)
//                 }
//             }
//         }

//         console.log(result)
//     } catch (e) {
//         console.log(e)
//     }
//     console.log(result)
//     res.json(result)
// }



exports.GetAll = async (req, res) => {
    let result = []

    try {
        const number = req.query.number

        // 🔹 Base filter
        let filter = {
            deleted: false
        }

        if (number && number !== 'null') {
            filter.number = {
                [Op.like]: `%${number}%`
            }
        }

        // 🔹 Current date
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        // 🔹 Monthly amount (1 query)
        const monthlyAmount = await monthlyAmountRepo.CustomQuery({
            filter: {
                deleted: false,
                year: year,
                month_id: month
            }
        })

        if (!monthlyAmount) {
            return res.json([])
        }

        // 🔹 Get number list (1 query)
        const list = await repo.CustomQueryFindAll({ filter, order:['id','asc'] })

        if (!list || list.length === 0) {
            return res.json([])
        }

        // 🔹 Get ALL order sums in ONE query (🔥 key optimization)
        const orderSums = await orderRepo.model.findAll({
            attributes: [
                'number_id',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            where: {
                deleted: false,
                year: year,
                month_id: month
            },
            group: ['number_id'],
            raw: true
        })

        // 🔹 Convert to map for O(1) lookup
        const orderMap = {}
        for (const item of orderSums) {
            orderMap[item.number_id] = parseFloat(item.total) || 0
        }

        // 🔹 Build result (NO DB CALL INSIDE LOOP 🚀)
        for (const data of list) {
            const totalOrder = orderMap[data.id] || 0

            let vm = new OrderViewModel()
            vm.id = data.id
            vm.number = data.number
            vm.total_amount = monthlyAmount.amount
            vm.avaliable = monthlyAmount.amount - totalOrder
            vm.status = monthlyAmount.amount > totalOrder
                ? orderStatusEnum.Available
                : orderStatusEnum.Full

            result.push(vm)
        }

    } catch (e) {
        console.error("GetAll Error:", e)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            detail: e.message
        })
    }

    return res.json(result)
}