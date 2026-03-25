class MonthlyAmountViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    month_id = null
    month_name = ''
    from_day = 1
    to_day = 15
    amount =null
    status = false
    deleted = false
}
module.exports =  MonthlyAmountViewModel