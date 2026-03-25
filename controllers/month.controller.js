const Month = require("../models/month.model");
const RepositoryBase = require("./common/repository.base");

const repo = new RepositoryBase(Month)

exports.InitMonth = async () => {
    try {
        const filter = { deleted: false }
        const count = await repo.GetCount({ filter: filter })

        if (count <= 0) {
            const now = new Date()

            const monthList = [
                { id:1, month_id: 1,  month_name: 'January',   deleted: false, created_date: now, created_by: 0 },
                { id:2, month_id: 2,  month_name: 'February',  deleted: false, created_date: now, created_by: 0 },
                { id:3, month_id: 3,  month_name: 'March',     deleted: false, created_date: now, created_by: 0 },
                { id:4, month_id: 4,  month_name: 'April',     deleted: false, created_date: now, created_by: 0 },
                { id:5,  month_id: 5,  month_name: 'May',       deleted: false, created_date: now, created_by: 0 },
                { id:6, month_id: 6,  month_name: 'June',      deleted: false, created_date: now, created_by: 0 },
                { id:7, month_id: 7,  month_name: 'July',      deleted: false, created_date: now, created_by: 0 },
                { id:8, month_id: 8,  month_name: 'August',    deleted: false, created_date: now, created_by: 0 },
                { id:9, month_id: 9,  month_name: 'September', deleted: false, created_date: now, created_by: 0 },
                { id:10, month_id: 10, month_name: 'October',   deleted: false, created_date: now, created_by: 0 },
                { id:11, month_id: 11, month_name: 'November',  deleted: false, created_date: now, created_by: 0 },
                { id:12, month_id: 12, month_name: 'December',  deleted: false, created_date: now, created_by: 0 }
            ]

            await repo.bulkSave(monthList) 
        }

    } catch (error) {
        console.log(error)
    }
}

exports.GetAll = async (req,res) =>{
    let result = []
    try{
         const filter = { deleted: false }
         result = await repo.CustomQueryFindAll({filter: filter})
    }catch(e){
        console.log(e)
    }
    res.json(result)
}