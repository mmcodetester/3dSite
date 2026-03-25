class DailyReportViewModel{
    constructor(){}
    id = 0
    year = new Date().getFullYear()
    month = new Date().getMonth() + 1
    number = ''
    amount = ''
    order_by = ''
    date = ''
    from_to = ''
}
module.exports = DailyReportViewModel