const Month = require("../models/month.model");
const MonthlyAmount = require("../models/monthly.amount");
const CommandResult = require("../utils/helpers/command.result");
const PageResult = require("../utils/helpers/page.result");
const MonthlyAmountViewModel = require("../viewmodels/monthly.amount.viewmodel");
const RepositoryBase = require("./common/repository.base");
const repo = new RepositoryBase(MonthlyAmount)

exports.GetAll = async (req, res) => {
    let result = new PageResult();
    try {
        const { year, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let filter = {
            deleted: false,
        }
        if (year) {
            filter.year = year
        }
        let order = [];

        if (sortBy === 'month_name') {
            order = [{ model: Month, as: 'month' }, 'month_name', sortOrder];
        } else {
            order = [sortBy, sortOrder];
        }
        const list = await repo.getAll({
            filter: filter,
            page: page,
            length: length,
            order: order,
            include:[
                {
                    association: 'month',
                    where: { deleted: false },
                    required: false,
                },
            ]
        })
        if(list.total>0){
            list.data.forEach((data)=>{
                let vm = new MonthlyAmountViewModel()
                vm.id = data.id
                vm.year = data.year
                vm.month_id = data.month_id
                if(data.month){
                    vm.month_name = data.month.month_name
                }
                vm.amount = data.amount
                result.data.push(vm)
            })
        }
        result.total = list.total
    } catch (e) {
        logger.error(e)
    }
    res.json(result)
}

exports.Save = async (req, res) => {
    let result = new CommandResult()
    try {
        const data = {
            id: req.body.id,
            year: req.body.year,
            month_id: req.body.month_id,
            amount: req.body.amount,
            deleted: false,
        }
        const duplicate = await isDuplicate(data)
        if (!duplicate) {
            result = await repo.save(data)
        } else {
            result.success = false
            result.messages.push('Duplicate Record')
        }

    } catch (e) {
        result.success = false
        result.messages.push(e)
    }
    res.json(result)
}

exports.GetById = async (req, res) => {
    let data = {};
    try {
        const { id } = req.query
        if (id) {
            data = await repo.getById({ id: id })
        }
    } catch (e) {

    }
    res.json(data)
}

/**
 * Delete Location by ID
 * @param {*} id 
 * request must have parameter id
 * @returns  CommandResult({success , id, data, messages})
 */
exports.Delete = async (req, res) => {
    let result = new CommandResult()
    try {
        const { id } = req.query
        if (id) {
            result = await repo.delete({ id: id })
        }
    } catch (e) {

    }
    res.json(result)
}

const isDuplicate = async (data) => {
    let duplicate = false
    if (data.id > 0) {
        const item = await repo.getById({ id: data.id })
        if (item.year == data.year && item.month_id == data.month_id) {
            duplicate = false
        } else {
            const filter = {
                deleted: false,
                year: data.year,
                month_id: data.month_id
            }
            const existing = await repo.CustomQuery({ filter: filter })
            if (existing) {
                duplicate = true
            }
        }
    } else {
        const filter = {
            deleted: false,
            year: data.year,
            month_id: data.month_id
        }
        const existing = await repo.CustomQuery({ filter: filter })
        if (existing) {
            duplicate = true
        }
    }
    return duplicate;
}