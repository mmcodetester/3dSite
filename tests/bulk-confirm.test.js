const test = require('node:test')
const assert = require('node:assert/strict')
const { Op } = require('sequelize')
const { confirmOtherOrders } = require('../services/other-order-confirm.service')

function database(rows, failure) {
    let saved = structuredClone(rows)
    let transactions = 0
    const model = {
        sequelize: { transaction: async work => {
            transactions++
            const transaction = { LOCK: { UPDATE: 'UPDATE' }, rows: structuredClone(saved) }
            const result = await work(transaction)
            saved = transaction.rows
            return result
        } },
        findAll: async options => {
            assert.equal(options.lock, 'UPDATE')
            return options.transaction.rows.filter(row => options.where.id[Op.in].includes(row.id))
        },
        update: async (values, options) => {
            assert.deepEqual(values, { status: true })
            assert.equal(options.where.status, false)
            assert.equal(options.where.deleted, false)
            const selected = options.transaction.rows.filter(row => options.where.id[Op.in].includes(row.id) && !row.status && !row.deleted)
            selected.forEach(row => { row.status = true })
            if (failure === 'throw') throw new Error('Database failed')
            return [failure === 'partial' ? 0 : selected.length]
        },
    }
    return { model, rows: () => saved, transactions: () => transactions }
}
const row = (id, overrides = {}) => ({ id, amount: 100, extra: 20, status: false, deleted: false, created_by: 1, created_date: '2026-10-16', ...overrides })

test('bulk confirms only selected rows and preserves money, ownership, and dates', async () => {
    const original = [row(1), row(2), row(3)]
    const db = database(original)
    assert.deepEqual(await confirmOtherOrders([1,2],db.model), {count:2,already_confirmed:0})
    assert.deepEqual(db.rows(),original.map(item=>({...item,status:item.id!==3})))
    assert.equal(db.transactions(),1)
})
test('duplicate IDs do not create duplicate submissions', async () => {
    const db=database([row(1),row(2)])
    assert.deepEqual(await confirmOtherOrders([1,1,2],db.model),{count:2,already_confirmed:0})
})
test('retries and already-confirmed rows are safe', async () => {
    const db=database([row(1,{status:true}),row(2)])
    assert.deepEqual(await confirmOtherOrders([1,2],db.model),{count:1,already_confirmed:1})
    assert.deepEqual(await confirmOtherOrders([1,2],db.model),{count:0,already_confirmed:2})
})
test('invalid or empty selection never starts a transaction', async () => {
    const db=database([row(1)])
    for(const ids of [undefined,null,[],{},[0],[-1],['1'],[1.5],[NaN]]) {
        await assert.rejects(confirmOtherOrders(ids,db.model),error=>error.status===400)
    }
    assert.equal(db.transactions(),0)
})
test('missing or deleted selected rows reject the entire batch', async () => {
    for(const original of [[row(1)],[row(1),row(2,{deleted:true})]]) {
        const db=database(original)
        await assert.rejects(confirmOtherOrders([1,2],db.model),error=>error.status===409)
        assert.deepEqual(db.rows(),original)
    }
})
test('database failures and incomplete updates roll back the whole batch', async () => {
    for(const failure of ['throw','partial']) {
        const original=[row(1),row(2)]
        const db=database(original,failure)
        await assert.rejects(confirmOtherOrders([1,2],db.model))
        assert.deepEqual(db.rows(),original)
    }
})
