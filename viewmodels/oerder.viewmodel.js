const orderStatusEnum = require("../utils/order.status.enum")


class OrderViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    number_id = null
    number = ''
    month_id = null
    month_name = ''
    monthly_amount_id = null
    avaliable = 0
    total_amount = 0
    amount = 0
    status  = orderStatusEnum.Available
    deleted = false
    created_by  = null
    created_date = new Date()
    extra = null
}
module.exports =  OrderViewModel