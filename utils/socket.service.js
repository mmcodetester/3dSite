// socket.js
const socketio = require('socket.io');
const RepositoryBase = require('../controllers/common/repository.base');
const FullNumber = require('../models/fullnumber.model');
const repo = new RepositoryBase(FullNumber)
let io;

module.exports = {
    /**
     * Initialize Socket.IO with the given HTTP server
     * @param {http.Server} server
     * @returns {socketio.Server}
     */
    init: function (server) {
        io = socketio(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            },

        });

        io.on('connection', (socket) => {
            console.log(`New client connected: ${socket.id}`);
            socket.on('getfullnumber',async (data) => {
                console.log(`Received from client: ${data}`);
                const filter = {
                    deleted : false
                }
                const fullNumber = await repo.CustomQueryFindAll({filter : filter})
               // console.log(fullNumber)
                // Optionally, emit a response
                socket.emit('fullnumbers', fullNumber);
                socket.broadcast.emit('fullnumbers', fullNumber);
            });
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },

    /**
     * Get the Socket.IO instance
     * @returns {socketio.Server}
     */
    getIO: function () {
        if (!io) {
            console.log('Socket.IO not initialized!');
            // throw new Error('Socket.IO not initialized!');
        }
        return io;
    },

    /**
     * Broadcast a message to all connected clients
     * @param {Object} message
     */
    sendMessageToClients: function (message) {
        if (!io) return;
        io.emit('message', message);
    },
    sendRentalCountChange: function () {
        if (!io) return;
        io.emit('rental_count_change');
    },
    sendUserCountChange: function () {
        if (!io) return;
        io.emit('user_count_change');
    },
    /**
     * Broadcast a numeric count to all connected clients
     * @param {number} count
     */
    sendCount: function (count) {
        if (!io) return;
        logger.info(`Broadcasting count: ${count}`);
        io.emit('count', count);
    },

    /**
     * Broadcast a user's online status
     * @param {Object} user
     */
    userOnlineStatus: function (user) {
        if (!io) return;
        io.emit('online', user);
    },
};
