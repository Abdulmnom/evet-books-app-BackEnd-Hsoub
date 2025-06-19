const Booking = require('../models/booking');
const Event = require('../models/event');
const { transformBooking, transformEvent } = require('./transforms');
const { UserInputError, AuthenticationError } = require('apollo-server-errors');

const bookingResolvers = {
    Query: {
        bookings: async (_, args, context) => {
            if (!context.user) {
                throw new AuthenticationError("يجب تسجيل الدخول");
            }
            try {
                const bookings = await Booking.find({ user: context.user._id })
                    .populate('event')
                    .populate('user');
                return bookings.map(booking => transformBooking(booking));
            } catch (error) {
                console.error('Bookings Query Error:', error);
                throw new UserInputError('حدث خطأ في جلب الحجوزات');
            }
        }
    },
    Mutation: {
        bookEvent: async (_, args, context) => {
            if (!context.user) {
                throw new AuthenticationError("يجب تسجيل الدخول");
            }
            if (!args.eventId) {
                throw new UserInputError('معرف الحدث مطلوب');
            }

            try {
                // تحقق من وجود حجز سابق
                const existingBooking = await Booking.findOne({
                    event: args.eventId,
                    user: context.user._id
                });

                if (existingBooking) {
                    throw new UserInputError('لديك حجز لهذا الحدث مسبقاً');
                }

                // تحقق من وجود الحدث
                const event = await Event.findById(args.eventId);
                if (!event) {
                    throw new UserInputError('هذا الحدث غير موجود');
                }

                // إنشاء الحجز
                const booking = new Booking({
                    event: event._id,
                    user: context.user._id
                });

                const savedBooking = await booking.save();
                await savedBooking.populate('event');
                return transformBooking(savedBooking);

            } catch (err) {
                console.error('Book Event Error:', err);
                if (err instanceof UserInputError) {
                    throw err;
                }
                throw new UserInputError('حدث خطأ أثناء حجز الحدث');
            }
        },

        cancelBooking: async (_, args, context) => {
            if (!context.user) {
                throw new AuthenticationError("يجب تسجيل الدخول");
            }
            if (!args.bookingId) {
                throw new UserInputError('معرف الحجز مطلوب');
            }

            try {
                const booking = await Booking.findById(args.bookingId)
                    .populate('event')
                    .populate('user');

                if (!booking) {
                    throw new UserInputError('هذا الحجز غير موجود');
                }

                if (booking.user._id.toString() !== context.user._id.toString()) {
                    throw new AuthenticationError("لا يمكنك إلغاء حجز غيرك");
                }

                const event = transformEvent(booking.event);
                await Booking.deleteOne({ _id: args.bookingId });
                
                return event;

            } catch (err) {
                console.error('Cancel Booking Error:', err);
                if (err instanceof UserInputError || err instanceof AuthenticationError) {
                    throw err;
                }
                throw new UserInputError('حدث خطأ أثناء إلغاء الحجز');
            }
        }
    }
};

module.exports = { bookingResolvers };
