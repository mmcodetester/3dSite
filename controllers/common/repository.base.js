const { Model } = require('sequelize')
const CommandResult = require("../../utils/helpers/command.result")
const PageResult = require("../../utils/helpers/page.result");
const constants = require('../../utils/constants');
/**
 * @model must be sequelize's define model 
 */
class RepositoryBase {
    constructor(model) {
        if (!model || !(model.prototype instanceof Model)) {
            console.log('err : model must be sequelize model ')
            logger.error(`err : ${model} must be sequelize model`)
        }
        this.model = model
    }
    async getAll({ page = 1, length = 10, filter = {}, include = [], order = ['id', 'DESC'] }) {
        let result = new PageResult()
        try {

            length = parseInt(length) || 10;

            const offset = (page - 1) * length;
            result.total = await this.model.count({ where: filter })
            if (result.total > 0) {
                const data = await this.model.findAll({
                    where: filter,
                    include: include,
                    order: order.length ? [order] : [],
                    offset: offset,
                    limit: length,
                    include: include.length ? include : []
                });
                result.data = data;
            }

            result.filter = filter
        } catch (e) {
            console.log(e)
        }
        return result
    }
    async getAllData() {
        let data = []
        try {
            data = await this.model.findAll({ where: { deleted: false } })
        } catch (e) {
            logger.error(e)
        }
        return data
    }
    async getById({ id = 0 }) {
        let data = null
        try {
            if (id > 0) {
                data = await this.model.findByPk(parseInt(id))
            }
        } catch (e) {

        }
        return data
    }
    async delete({ id = 0 }) {
        let result = new CommandResult()
        const transaction = await this.model.sequelize.transaction();
        try {
            let existingRecord = await this.model.findByPk(parseInt(id));

            if (!existingRecord) {
                result.success = false;
                result.messages.push(constants.RecordNotFound);
            } else {
                existingRecord = existingRecord.get({ plain: true })
                existingRecord.deleted = true
                const updated = await this.model.update(existingRecord, { where: { id: existingRecord.id }, transaction });
                result.data = updated;
                result.id = result.data.id;
                result.success = true;
                result.messages.push(constants.DeleteSuccessMessage);
            }
            await transaction.commit()
        } catch (e) {
            console.log(e)
            await transaction.rollback()
            result.success = false;
            result.messages.push(e)
        }
        return result
    }
    async save(data) {
        let result = new CommandResult();
        const transaction = await this.model.sequelize.transaction();
        try {
            if (data.id > 0) {
                const existingRecord = await this.model.findByPk(data.id, { transaction });
                
                if (!existingRecord) {
                    result.success = false;
                    result.messages.push(constants.RecordNotFound);
                } else {
                    existingRecord.updated_date = new Date()
                    const updated = await this.model.update(data, { where: { id: data.id } }, { transaction });
                    if (updated) {

                    }
                    result.data = data;
                    result.id = result.data.id;
                    result.success = true;
                    result.messages.push(constants.EditSuccessMessage);
                }
            } else {
                data.id = null;
                data.created_date = new Date()
                const created = await this.model.create(data, { transaction });
                result.data = created.get({ plain: true });
                result.id = result.data.id;
                result.success = true;
                result.messages.push(constants.SaveSuccessMessage);
            }

            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            result.success = false;
            result.messages.push(e.message || e.toString());
        }

        return result;
    }

    /**
     * 
     * @param {*} list 
     * @returns  CommandResult({success , id, data, messages})
     */
    async bulkSave(list) {
        let result = new CommandResult()
        const transaction = await this.model.sequelize.transaction();
        try {
            await this.model.bulkCreate(list, { transaction })
            await transaction.commit()
            result.success = true;
            result.messages.push(constants.SaveSuccessMessage);
        } catch (e) {
            await transaction.rollback()
            result.success = false;
            result.messages.push(e);
        }
        return result
    }

    async bulkUpdate(list) {
        let result = new CommandResult()
        const transaction = await this.model.sequelize.transaction()
        try {
            await Promise.all(
                list.map(item =>
                    this.model.update(
                        {
                            read: item.read,
                            write: item.write,
                            delete: item.delete,
                            print: item.print,
                            updated_date: new Date(),
                            updated_by: item.updated_by
                        },
                        {
                            where: {
                                id: item.id,
                                program_id: item.program_id,
                                role_id: item.role_id
                            },
                            transaction
                        }
                    )
                )
            )

            await transaction.commit()
            result.success = true;
            result.messages.push(constants.SaveSuccessMessage)
        } catch (e) {
            await transaction.rollback()
            result.success = false
            result.messages.push(e)
        }
        return result
    }

    /**
    *Retrieve first data with custom filter and include association
    *@param {Object}   [param.filter={}] - Filter conditions for querying data.
    * @param {Array}    [param.include=[]]     - Array of associated models to include.
    * @returns {Promise<Object>} Sequelize model value .
    */
    async CustomQuery({ filter = {}, include = [] }) {
        let data;
        try {
            data = await this.model.findOne({ where: filter, include: include })
        } catch (error) {
            //logger.error(`${this.model}, ${this.error}`)
        }
        return data;
    }
    /**
      *Retrieve first data with custom filter and include association
      *@param {Object}   [param.filter={}] - Filter conditions for querying data.
      *@param {Object}   [param.include={}] -  Array of associated models to include.
      * @returns {Promise<Object>} Sequelize model value .
      */
    async CustomQueryFindAll({ filter = {}, include = [] ,order = ['id', 'DESC'] }) {
        var data = [];
        try {
            data = this.model.findAll({ where: filter, include: include , order: order.length ? [order] : [],})
        } catch (error) {
            //logger.error(`${this.model}, ${this.error}`)
        }
        return data;
    }
    async GetCount({ filter }) {
        var count = await this.model.count({ where: filter })
        return count;
    }
    async GetSum({ field_name = '', filter = {} }) {
        try {
            var total = await this.model.sum(field_name, {
                where: filter
            })
            return total
        } catch (err) {
            //logger.error(err)
            return 0
        }

    }
}

module.exports = RepositoryBase