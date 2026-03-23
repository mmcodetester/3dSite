const Month = require("../models/month.model");
const RepositoryBase = require("./common/repository.base");

const monthRepo= new RepositoryBase(Month)

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