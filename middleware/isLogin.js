const { AuthenticationError } = require('apollo-server-errors');

const isLogedIn = (parent, args, {user} , info) => {
    if (!user) {
        throw new AuthenticationError("يجب تسجيل دخولك");
    }
}

module.exports = { isLogedIn };