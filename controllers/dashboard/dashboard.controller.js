const moment = require('moment')
const Order = require('../../models/order.model')
const { fn, col, Op } = require('sequelize')

exports.GetDailyCompairsm = async (req, res) => {
    try {
        // Use Myanmar calendar dates without converting midnight to a UTC date.
        const today = moment().utcOffset('+06:30').startOf('day')
        const firstDay = today.clone().startOf('month')
        const totals = await Order.findAll({
            attributes: [
                'created_date',
                [fn('SUM', col('amount')), 'total_amount'],
                [fn('SUM', col('extra')), 'total_extra'],
            ],
            where: {
                deleted: false,
                created_date: {
                    [Op.between]: [firstDay.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')],
                },
            },
            group: ['created_date'],
            order: [['created_date', 'ASC']],
            raw: true,
        })
        const byDate = new Map(totals.map(row => [row.created_date, row]))
        const labels = []
        const amountData = []
        const extraData = []
        for (const day = firstDay.clone(); day.isSameOrBefore(today, 'day'); day.add(1, 'day')) {
            const total = byDate.get(day.format('YYYY-MM-DD'))
            labels.push(day.format('DD/MM'))
            amountData.push(Number(total?.total_amount ?? 0))
            extraData.push(Number(total?.total_extra ?? 0))
        }
        res.json({
            labels,
            series: [
                { name: 'Total Amount', data: amountData },
                { name: 'Extra', data: extraData },
            ],
        })
    } catch (error) {
        console.error('Failed to load daily comparison:', error)
        res.status(500).json({ message: 'Failed to load daily order comparison.' })
    }
}

exports.GetMonthlyCompairsm = async (req, res) => {
    try {
        const year = new Date().getFullYear()
        // Aggregate orders directly: the legacy view also groups by created_date.
        const totals = await Order.findAll({
            attributes: [
                'month_id',
                [fn('SUM', col('amount')), 'total_amount'],
                [fn('SUM', col('extra')), 'total_extra'],
            ],
            where: { deleted: false, year },
            group: ['month_id'],
            order: [['month_id', 'ASC']],
            raw: true,
        })
        const byMonth = new Map(totals.map(row => [Number(row.month_id), row]))
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        res.json({
            labels,
            series: [
                {
                    name: 'Total Amount',
                    data: labels.map((_, index) => Number(byMonth.get(index + 1)?.total_amount ?? 0)),
                },
                {
                    name: 'Extra',
                    data: labels.map((_, index) => Number(byMonth.get(index + 1)?.total_extra ?? 0)),
                },
            ],
        })
    } catch (error) {
        console.error('Failed to load monthly comparison:', error)
        res.status(500).json({ message: 'Failed to load monthly order comparison.' })
    }
}
