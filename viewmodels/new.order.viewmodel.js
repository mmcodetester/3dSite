class NewOrderViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    month_id = 0
    number_id = 0
    amount = 0
    date= new Date()
    created_by = null
    deleted = false
}
module.exports =  NewOrderViewModel