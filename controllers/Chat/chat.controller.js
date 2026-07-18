const Chat = require("../../models/chat.model");
const RepositoryBase = require("../common/repository.base");
const socketService = require('../../utils/socket.service');
const { GetLoggedInUser } = require("../../services/auth.service");
const ChatViewModel = require("../../viewmodels/Chat/chat.viewmodel");
const repo = new RepositoryBase(Chat)
const moment = require('moment')

exports.GetAll = async (req, res) => {
    var data = [];
    try {
        const filter = {
            deleted: false
        }
        data = await repo.CustomQueryFindAll({ filter: filter,order:  ['id', 'ASC'] });
    } catch (e) {
        console.log(e)
    }
    res.json(data)
}

exports.SendMessage = async (req, res) => {
    try {
        var vm = new ChatViewModel()
        const text = req.body.text
        if (text) {
            vm.text = text
            const user = await GetLoggedInUser(req)
            if (user) {
                vm.sender = user.name
                vm.sender_id = user.id
                vm.date = new Date()
                const result =  await repo.save(vm)
                console.log(result)
                vm.date = moment(new Date()).format("DD/MM/YYYY h:mm a")
                socketService.sendMessageToClients(vm)
                
            }
        }
    } catch (e) {
        console.log(e)
    }
    res.json({success: true})
}