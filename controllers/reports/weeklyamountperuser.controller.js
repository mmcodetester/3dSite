const MonthlyAmount = require("../../models/monthly.amount");
const User = require("../../models/user.model");
const WeeklyAmountPerUser = require("../../models/weeklyamountperuser");
const PageResult = require("../../utils/helpers/page.result");
const WeeklyAmountViewModel = require("../../viewmodels/reports/weekly.amount.viewmodel");
const RepositoryBase = require("../common/repository.base");

const userRepo = new RepositoryBase(User)
const repo = new RepositoryBase(WeeklyAmountPerUser)
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
exports.GetAll = async(req, res) =>{
    let result = new PageResult()
    let list = new PageResult()
    try {
        const { monthly_amount_id, number, id, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let activeAmountId = monthly_amount_id;

        if (!activeAmountId) {
            activeAmountId = await GetActiveAmountId();
        }

        let filter = {
            monthly_amount_id: activeAmountId
        }
        if(id){
            filter.id = id
        }
        list = await repo.getAll({ 
            filter: filter ,
            include:[
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
                }
            ]
        })
        result.total = list.total
        if(list.total>0){
            list.data.forEach((data)=>{
                let vm =new WeeklyAmountViewModel()
                vm.id = data.id
                vm.name = data.name
                vm.username = data.username
                vm.total_amount = data.total_amount
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
    }catch(e){
        console.log(e)
    }
    res.json(result)
}

exports.GetTotal = async (req, res) => {
    let result = 0
    try {
         const { monthly_amount_id, number, id, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let filter = {
            monthly_amount_id: monthly_amount_id ?? await GetActiveAmountId()
        }
        if (id) {
            filter.id = id
        }
        if(id){
            filter.id = id
        }
        result = await repo.GetSum({ field_name: 'total_amount', filter: filter })
    } catch (e) {
        console.log(e)
    }
    res.json(result)
}

exports.GetWeeklyCompairsmByUser=async (req, res) =>{
    const result = []
    try{
        const filter = {
            deleted : false
        }
        const userList = await userRepo.CustomQueryFindAll({filter:filter})
        for(let user of userList){
            let vm = {
                key: user.id,
                title : user.name,
                value  : 0
            }
            const monthlyAmount = await GetActiveAmountId()
            const totalFilter = {
                monthly_amount_id : monthlyAmount,
                id : user.id
            }
            vm.value  = await repo.GetSum({ field_name: 'total_amount', filter: totalFilter }) ?? 0
            result.push(vm)
        }
    }catch(e){
        console.log(e)
    }  
    res.json(result)
}