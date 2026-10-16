const { Op } = require('sequelize')

function invalid(message, status) {
    const error = new Error(message)
    error.status = status
    return error
}

exports.confirmOtherOrders = async (ids, model) => {
    if (!Array.isArray(ids) || !ids.length ||
        ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
        throw invalid('တင်မည့်စာရင်းများကို ရွေးပါ။', 400)
    }
    const uniqueIds = [...new Set(ids)]
    return model.sequelize.transaction(async transaction => {
        const records = await model.findAll({
            attributes: ['id', 'status', 'deleted'],
            where: { id: { [Op.in]: uniqueIds } },
            transaction,
            lock: transaction.LOCK.UPDATE,
            order: [['id', 'ASC']],
        })
        if (records.length !== uniqueIds.length || records.some(row => row.deleted)) {
            throw invalid('ရွေးထားသောစာရင်း ပြောင်းလဲသွားပါပြီ။ Refresh လုပ်ပြီး ပြန်ရွေးပါ။', 409)
        }
        const pendingIds = records.filter(row => !row.status).map(row => row.id)
        if (pendingIds.length) {
            const [count] = await model.update({ status: true }, {
                where: { id: { [Op.in]: pendingIds }, status: false, deleted: false },
                transaction,
            })
            if (count !== pendingIds.length) {
                throw invalid('စာရင်းအားလုံး မတင်နိုင်သဖြင့် ပြန်လည်ကြိုးစားပါ။', 409)
            }
        }
        return { count: pendingIds.length, already_confirmed: uniqueIds.length - pendingIds.length }
    })
}
