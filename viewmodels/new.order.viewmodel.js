class NewOrderViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    month_id = 0
    number_id = 0
    monthly_amount_id = null
    extra = null
    amount = 0
    date= new Date()
    created_by = null
    updated_by =null
    updated_date = null
    status = false
    deleted = false
}
module.exports =  NewOrderViewModel