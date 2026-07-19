const Chat = require("../../models/chat.model");
const RepositoryBase = require("../common/repository.base");
const socketService = require('../../utils/socket.service');
const { GetLoggedInUser } = require("../../services/auth.service");
const ChatViewModel = require("../../viewmodels/Chat/chat.viewmodel");
const repo = new RepositoryBase(Chat)
const moment = require('moment')
const { Op } = require('sequelize')

exports.GetAll = async (req, res) => {
    var result = [];
    try {
        const limit = parseInt(req.query.limit) || 20;
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
        const direction = req.query.direction || 'backward';

        let filter = { deleted: false };

        if (cursor) {
            if (direction === 'backward') {
                filter.id = { [Op.lt]: cursor };
            } else if (direction === 'forward') {
                filter.id = { [Op.gt]: cursor };
            }
        }

        const orderDirection = direction === 'forward' ? 'ASC' : 'DESC';

        let list = await repo.CustomQueryFindAll({
            filter: filter,
            order: ['id', orderDirection],
            include: [
                {
                    association: 'sender',
                    where: { deleted: false },
                    required: false,
                },
            ],
            limit: limit
        });

        if (list && list.length > 0) {
            if (direction === 'backward') {
                list.reverse();
            }

            list.forEach((data) => {
                const socketPayload = {
                    server_id: data.id,
                    text: data.text,
                    sender: data.sender ? data.sender.name : 'Deleted User',
                    sender_id: data.sender_id,
                    date: moment(data.date).format("DD/MM/YYYY h:mm a")
                }
                result.push(socketPayload)
            });
        }
    } catch (e) {
        console.error("Error in GetAll:", e);
        res.status(500).json({ error: "Failed fetching logs" });
    }
    res.json(result);
}

exports.SendMessage = async (req, res) => {
    try {
        const text = req.body.text
        const local_id = req.body.local_id
        console.log(req.body.local_id)
        var server_id = null
        var success = false
        if (text) {
            var vm = new ChatViewModel()
            vm.text = text
            const user = await GetLoggedInUser(req)

            if (user) {
                vm.sender = user.name
                vm.sender_id = user.id
                vm.date = new Date()

                const result = await repo.save(vm)

                server_id = result ? result.id : null;

                const formattedDate = moment(vm.date).format("DD/MM/YYYY h:mm a")

                const socketPayload = {
                    local_id: local_id,
                    server_id: server_id,
                    text: vm.text,
                    sender: vm.sender,
                    sender_id: vm.sender_id,
                    date: formattedDate
                }

                socketService.sendMessageToClients(socketPayload)

                success = true
            }
        }
    } catch (e) {
        success = false
        console.log(e)
    }
    res.json({ success: success, server_id: server_id })
}

exports.SendTypingEvent = async (req, res) => {
    try {
        const user = await GetLoggedInUser(req)
        if (user) {
            const socketPayload = {
                server_id: null,
                sender: user.name,
                sender_id: user.id,
            }
            socketService.sendTypingEventToClients(socketPayload)
        }
    } catch (e) {
        console.log(e)
    }
    res.json({ success: true })
}