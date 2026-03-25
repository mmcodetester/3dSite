const moment = require("moment");
const User = require("../models/user.model");
const constants = require("../utils/constants");
const CommandResult = require("../utils/helpers/command.result");
const PageResult = require("../utils/helpers/page.result");
const UserViewModel = require("../viewmodels/user.viewmodel");
const RepositoryBase = require("./common/repository.base");
const bcrypt = require('bcrypt')

const repo = new RepositoryBase(User)

exports.GetAll = async (req, res) => {
    let result = new PageResult();
    try {
        const { name, role_id, page = 1, length = 10, sortBy = 'id', sortOrder = 'DESC' } = req.query
        let filter = {
            deleted: false,
        }
        if (name) {
            filter.name = {
                [Op.like]: `%${name}%`
            }
        }
        if (role_id) {
            filter.role_id = role_id
        }
        let order = [];
        if (sortBy == 'join_date') {
            order = ['created_date', sortOrder];
        } else {
            order = [sortBy, sortOrder];
        }
        const list = await repo.getAll({
            filter: filter,
            page: page,
            length: length,
            order: order,
        })
        if (list.total > 0) {
            list.data.forEach((data) => {
                let vm = new UserViewModel()
                vm.id = data.id
                vm.name = data.name
                vm.username = data.username
                vm.password = data.password
                vm.join_date = moment(new Date(data.created_date)).format('DD/MM/yyyy')
                
                result.data.push(vm)
            });
        }
        result.total = list.total
    } catch (e) {
        console.log(e)
    }

    res.json(result)
}

exports.Save = async (req, res) => {
    let result = new CommandResult()
    try {
        const data = {
            id: req.body.id,
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
            deleted: false,
        }
        const duplicate = await isDuplicate(data)
        if (!duplicate) {
            if (data.id > 0) {
                const item = await repo.getById({ id: data.id })
                data.password = item.password
            } else {
                const saltRounds = 10;
                data.password = await bcrypt.hash(data.password, saltRounds);
            }
            result = await repo.save(data)
        } else {
            result.success = false
            result.messages.push(constants.DuplicateRecord)
        }

    } catch (e) {

    }
    res.json(result)
}
const isDuplicate = async (data) => {
    let duplicate = false
    if (data.id > 0) {
        const item = await repo.getById({ id: data.id })
        if (item.username == data.username) {
            duplicate = false
        } else {
            const filter = {
                deleted: false,
                username: data.username
            }
            const existing = await repo.CustomQuery({ filter: filter })
            if (existing) {
                duplicate = true
            }
        }
    } else {
        const filter = {
            deleted: false,
            username: data.username
        }
        const existing = await repo.CustomQuery({ filter: filter })
        if (existing) {
            duplicate = true
        }
    }
    return duplicate;
}
exports.GetById = async (req, res) => {
    let data = {};
    try {
        const { id } = req.query
        if (id) {
            data = await repo.getById({ id: id })
        }
    } catch (e) {

    }
    res.json(data)
}

exports.Delete = async (req, res) => {
    let result = new CommandResult()
    try {
        const { id } = req.query
        console.log(id)
        if (id) {
            result = await repo.delete({ id: id })
        }
    } catch (e) {

    }
    res.json(result)
}
