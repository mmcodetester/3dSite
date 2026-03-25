const Month = require("../models/month.model");
const MonthlyAmount = require("../models/monthly.amount");
const User = require("../models/user.model");
const RepositoryBase = require("./common/repository.base");

const userRepo = new RepositoryBase(User)
const monthRepo= new RepositoryBase(Month)
const monthlyAmountRepo = new RepositoryBase(MonthlyAmount)

exports.GetMonthList = async(req, res)=>{
    let result =[];
    try{
        const filter = {
            deleted: false
        }
        result =await monthRepo.CustomQueryFindAll({filter:filter})
    }catch(e){
        console.log(e)
    }
    res.json(result)
}


exports.GetWeeklyListByYear = async (req, res) =>{
    let result = [] 
    try{
        const { year } = req.query
        const filter = {
            deleted : false
        }
        if(year){
            filter.year = year
        }
        const list = await monthlyAmountRepo.CustomQueryFindAll({
            filter : filter,
            include :[
               {
                    association: 'month',
                    where: { deleted: false },
                    required: false,
                },
            ]
        })
        list.forEach((data) => {
            let vm = {
                id : data.id,
                name :'',
                status : data.status
            }

            if(data.month){
                vm.name = data.month.month_name +" ( "+ data.from_day +" - " + data.to_day + " )";
            }
            result.push(vm)
        });

    }catch(e){
        console.log(e)
    }
    res.json(result)
}

exports.GetUserList = async(req, res)=>{
    let result =[];
    try{
        const filter = {
            deleted: false
        }
        result =await userRepo.CustomQueryFindAll({filter:filter})
    }catch(e){
        console.log(e)
    }
    res.json(result)
}