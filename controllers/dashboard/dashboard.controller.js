const moment = require('moment')
const RepositoryBase = require('../common/repository.base')
const Order = require('../../models/order.model')
const MonthlyTotal = require('../../models/monthlytotal.model')
const repo = new RepositoryBase(Order)
const monthlyTotalRepo = new RepositoryBase(MonthlyTotal)

exports.GetDailyCompairsm=async(req,res)=>{
    let result = {
        labels :[],
        series :{
            name:'',
            data : []
        }
    }
    try{
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth() // 0-indexed (0 = Jan)

        const firstDayOfMonth = new Date(year, month, 1)

        const days = []
        let current = new Date(firstDayOfMonth)

        // Stop when current day is after today
        while (current <= today) {
            days.push(current.toISOString().split('T')[0])
            current.setDate(current.getDate() + 1)
        }
        days.shift()
        const tdy = moment(new Date()).format('yyyy-MM-DD')
        days.push(tdy)
        for(let data of days){
            result.labels.push(moment(new Date(data)).format('DD/MM'))
            result.series.name = 'Order'
            const filter = {
                deleted: false,
                created_date : data
            }
            const total = await repo.GetSum({field_name:'amount', filter: filter})
            result.series.data.push(total ?? 0)
        }
       
    }catch(e){
        console.log(e)
    }
    res.json(result)
}

exports.GetMonthlyCompairsm = async (req, res) =>{
    let list=[];
    let result = {
        labels :[],
        series :{
            name:'',
            data : []
        }
    }
    try{
        const filter = {
            deleted: false,
            year: new Date().getFullYear()
        }
        list = await monthlyTotalRepo.CustomQueryFindAll({
            filter:filter,
            include:[
                {
                    association: 'month',
                    where: { deleted: false },
                    required: false,
                },
            ],
            order:['month_id','asc']
        })
        list.forEach((data)=>{
            if(data.month){
                result.labels.push(data.month.month_name.substring(0, 3))
                result.series.name = 'Order'
                result.series.data.push(data.total_amount)
            }
            
        })

    }catch(e){
        console.log(e)
    }
    res.json(result)
}