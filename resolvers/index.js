const { authResolvers } = require('./auth');
const { eventResolvers } = require('./event');
const { bookingResolvers } = require('./Booking');
const {merge} = require('lodash')


const resolvers = merge(
    authResolvers,
    eventResolvers,
    bookingResolvers

);

module.exports = { resolvers };