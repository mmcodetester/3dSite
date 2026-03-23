const orderStatusEnum = require("../utils/order.status.enum")


class OrderViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    number = ''
    month_id = null
    month_name = ''
    avaliable = 0
    total_amount = 0
    status  = orderStatusEnum.Available
    deleted = false
}
module.exports =  OrderViewModel