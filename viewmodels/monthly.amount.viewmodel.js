class MonthlyAmountViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    month_id = null
    month_name = ''
    amount =null
    deleted = false
}
module.exports =  MonthlyAmountViewModel