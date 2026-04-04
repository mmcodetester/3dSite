const moment = require("moment");
const Order = require("../../models/order.model");
const PageResult = require("../../utils/helpers/page.result");
const DailyReportViewModel = require("../../viewmodels/reports/dailyreport.viewmodel");
const RepositoryBase = require("../common/repository.base");
const Number = require("../../models/number.model");
const Month = require("../../models/month.model");
const ExcelJS = require('exceljs');
const User = require("../../models/user.model");
const DailyTotal = require("../../models/dailytotal.model");
const { Op, Sequelize } = require("sequelize");
const CommandResult = require("../../utils/helpers/command.result");


const repo = new RepositoryBase(Order)
const dailyTotalRepo = new RepositoryBase(DailyTotal)

exports.GetAll = async (req, res) => {
    let result = new PageResult()
    try {
        const { number, date, created_by, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let filter = {
            created_date: date ? new Date(date) : new Date()
        }
        if(number){
            filter.number = number
        }
        if(created_by){
            filter.created_by = created_by
        }
        result = await dailyTotalRepo.getAll({
            filter: filter,
            page: page,
            length: length,
            order: [sortBy, sortOrder],
        })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

exports.GetAllDetailReport = async (req, res) => {
    let result = new PageResult()
    try {
        const { number, created_by, date, page = 1, length = 10, sortBy = 'number', sortOrder = 'DESC' } = req.query
        let filter = {
            deleted: false,
            created_date: date ? new Date(date) : new Date()
        }
        if (created_by) {
            filter.created_by = created_by
        }
        let numberFilter = {
            deleted: false
        };
        if (number) {
            numberFilter.number = number
        }
        let order = [];
        if (sortBy === 'number') {
            order = [{ model: Number, as: 'number' }, 'number', sortOrder];
        } else if (sortBy == 'month') {
            order = [{ model: Month, as: 'month' }, 'month_name', sortOrder];
        } else if (sortBy == 'order_by') {
            order = [{ model: User, as: 'user' }, 'name', sortOrder];
        } else if (sortBy == 'date') {
            order = ['created_date', sortOrder];
        } else {
            order = [sortBy, sortOrder];
        }
        let list = await repo.getAll({
            filter: filter,
            page: page,
            length: length,
            order: order,
            include: [
                {
                    association: 'month',
                    where: { deleted: false },
                    required: false,
                },
                {
                    association: 'number',
                    where: numberFilter,
                    required: true,
                },
                {
                    association: 'user',
                    where: { deleted: false },
                    required: false,
                },
                {
                    association: 'monthly_amount',
                    where: { deleted: false },
                    required: false,
                },
            ]
        })
        if (list.total > 0) {
            result.total = list.total
            list.data.forEach((data) => {
                let vm = new DailyReportViewModel()
                vm.id = data.id
                vm.amount = data.amount
                vm.extra = data.extra ?? 0
                vm.date = moment(data.date).format('DD/MM/YYYY hh:mm A')
                if (data.month) {
                    vm.month = data.month.month_name
                }
                if (data.number) {
                    vm.number = data.number.number
                }
                if (data.user) {
                    vm.order_by = data.user.name
                }
                if (data.monthly_amount) {
                    vm.from_to = ` ${data.monthly_amount.from_day} - ${data.monthly_amount.to_day} `
                }
                result.data.push(vm)
            });
        }
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

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
exports.GetDetailsTotalAmount = async (req, res) => {
    let total = {
        total : 0,
        extra : 0
    };
    try {
        const { number, created_by, date } = req.query
        let filter = {
            created_date: date ? new Date(date) : new Date()
        }
        if (created_by) {
            filter.created_by = created_by
        }
        if (number) {
            filter.number = number
        }
        total.total = await dailyTotalRepo.GetSum({field_name:'total_amount', filter:filter})
       total.extra = await dailyTotalRepo.GetSum({field_name:'extra_amount', filter:filter})
    } catch (e) {
        console.log(e)
    }
    res.json(total)
}
exports.ExportExcelDetailReport = async (req, res) => {
    let result = new PageResult()
    try {
        const { number, created_by, date, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let filter = {
            deleted: false,
            created_date: new Date()
        }
        if (created_by) {
            filter.created_by = created_by
        }
        let numberFilter = {
            deleted: false
        };
        if (number) {
            numberFilter.number = { [Op.like]: `%${number}%` }
        }
        let order = [];
        if (sortBy === 'number') {
            order = [{ model: Number, as: 'number' }, 'number', sortOrder];
        } else if (sortBy === 'number') {
            order = [{ model: Number, as: 'number' }, 'number', sortOrder];
        }
        else if (sortBy == 'order_by') {
            order = [{ model: User, as: 'user' }, 'name', sortOrder];
        } else if (sortBy == 'date') {
            order = ['created_date', sortOrder];
        } else {
            order = [sortBy, sortOrder];
        }
        let list = await repo.CustomQueryFindAll({
            filter: filter,
            include: [
                {
                    association: 'month',
                    where: { deleted: false },
                    required: false,
                },
                {
                    association: 'number',
                    where: numberFilter,
                    required: true,
                },
                {
                    association: 'user',
                    where: { deleted: false },
                    required: false,
                },
                {
                    association: 'monthly_amount',
                    where: { deleted: false },
                    required: false,
                },
            ],
            order: order

        })
        if (list) {
            result.total = list.length
            let count = 0;
            list.forEach((data) => {
                count++;
               // console.log(data)
                let vm = new DailyReportViewModel()
                vm.id = count
                vm.amount = data.amount
                vm.date = moment(data.date).format('DD/MM/YYYY hh:mm A')
                if (data.month) {
                    vm.month = data.month.month_name
                }
                if (data.number) {
                    vm.number = data.number.number
                }
                if (data.user) {
                    vm.order_by = data.user.name
                }
                if (data.monthly_amount) {
                    vm.from_to = ` ${data.monthly_amount.from_day} - ${data.monthly_amount.to_day} `
                }
                result.data.push(vm)
            });
        }
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Report')
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Number', key: 'number', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Month', key: 'month', width: 15 },
            { header: 'From/To', key: 'from_to', width: 15 },
            { header: 'Created Date', key: 'date', width: 15 },
            { header: 'Created By', key: 'order_by', width: 15 }
        ]
        const headerRow = worksheet.getRow(1)

        headerRow.eachCell((cell) => {
            cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' }
            }

            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4CAF50' } // green background
            }

            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            }

            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        })
        result.data.forEach((data) => worksheet.addRow(data))


        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=report.xlsx'
        )

        await workbook.xlsx.write(res)
        res.end()
    } catch (e) {

    }

}

exports.GetTodayTotal = async (req, res) => {
    let total = 0
    try {
        let filter = {
            deleted: false,
            created_date: new Date()
        }
        total = await repo.GetSum({ field_name: 'amount', filter: filter })
    } catch (e) {

    }
    res.json(total)
}