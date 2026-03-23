const User = require("../models/user.model")
const constants = require("../utils/constants")
const LoginCommandResult = require("../utils/helpers/login.command.result")
const RepositoryBase = require("./common/repository.base")
const bcrypt = require('bcrypt')
const authService = require('../services/auth.service')

const repo = new RepositoryBase(User)
exports.Login = async(req, res) =>{
    let result = new LoginCommandResult()
    try{
        const loginUser = {
            username: req.body.username,
            password: req.body.password
        }
        const filter = {
            deleted: false,
            username: loginUser.username
        }
        const user = await repo.CustomQuery({ filter: filter,  })
        if(user){
            let isMatch = await bcrypt.compare(loginUser.password, user.password);
            if (isMatch) {
                    result.success = true;
                    result.messages.push(constants.LoginSuccessMessage);
                    result.data = user.toJSON();
                    result.token = authService.GenerateToken(user);
                } else {
                    result.success = false;
                    result.messages.push(constants.IncorrectUsernameOrPassword);
                }
        }else{
            result.messages.push(constants.IncorrectUsernameOrPassword)
        }
    }catch(e){
        console.log(e)
    }
    res.json(result)
}