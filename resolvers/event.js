const Event = require('../models/event');
const { transformEvent } = require('./transforms');
const { UserInputError, AuthenticationError } = require('apollo-server-errors');
const isLogedIn = require('../middleware/isLogin');

// Import the PubSub class Pablish and Subscribe
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const eventResolvers = {
    Query: {
        events: async () => {
                    try {
                        const events = await Event.find({}).populate('creator');
                        const validEvents = events.filter(event => event.creator); // فقط الأحداث التي لها creator
                        if (!validEvents || validEvents.length === 0) {
                            throw new UserInputError('لا توجد أحداث متاحة');
                        }
        
                        return validEvents.map(event => transformEvent(event));
                    } catch (error) {
                        throw error;
                    }
                },

    },
    Mutation: {
      createEvent: async (_, args, context) => {
    if (!context.user) {
        throw new AuthenticationError("يجب تسجيل الدخول!");
    }

    const { title, description, date, price } = args.eventInput;
    if (!title || !description || !date || !price) {
        throw new UserInputError('جميع الحقول مطلوبة');
    }

    try {
        // تحقق من عدم وجود حدث بنفس العنوان
        const existingEvent = await Event.findOne({ title });
        if (existingEvent) {
            throw new UserInputError('هذا الحدث موجود مسبقاً');
        }

        // التحقق من صحة التاريخ والسعر
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            throw new UserInputError('تاريخ غير صالح');
        }

        const eventPrice = parseFloat(price);
        if (isNaN(eventPrice) || eventPrice <= 0) {
            throw new UserInputError('السعر غير صالح');
        }

        // إنشاء الحدث
        const event = new Event({
            title,
            description,
            date: eventDate,
            price: eventPrice,
            creator: context.user._id
        });

        const savedEvent = await event.save();
        const createdEvent = transformEvent(savedEvent);

        // النشر للمشتركين
        pubsub.publish('EVENT_ADDED', { eventAdded: createdEvent });

        return createdEvent;

    } catch (err) {
        console.error('Create Event Error:', err);
        throw new UserInputError('حدث خطأ أثناء إنشاء الحدث', {
            invalidArgs: args.eventInput
        });
    }
}
,

        updateEvent: async (_, args, context) => {
            if (!context.user) {
                throw new AuthenticationError("يجب تسجيل الدخول!");
            }
            try {
                const event = await Event.findById(args.eventId);
                if (!event) {
                    throw new UserInputError('الحدث غير موجود');
                }
                if (event.creator.toString() !== context.user._id.toString()) {
                    throw new AuthenticationError("لا يمكنك تعديل حدث غيرك");
                }
                const updatedEvent = await Event.findByIdAndUpdate(
                    args.eventId,
                    args.eventInput,
                    { new: true }
                );
                return transformEvent(updatedEvent);
            } catch (err) {
                console.error('Update Event Error:', err);
                throw new UserInputError('حدث خطأ أثناء تحديث الحدث', {
                    invalidArgs: args.eventId
                });
            }
        },

        deleteEvent: async (_, args, context) => {
            if (!context.user) {
                throw new AuthenticationError("يجب تسجيل الدخول!");
            }
            try {
                const event = await Event.findById(args.eventId);
                if (!event) {
                    throw new UserInputError('الحدث غير موجود');
                }
                if (event.creator.toString() !== context.user._id.toString()) {
                    throw new AuthenticationError("لا يمكنك حذف حدث غيرك");
                }
                await Event.deleteOne({ _id: args.eventId });
                return Event.find({});
            } catch (err) {
                throw new UserInputError('حدث خطأ أثناء حذف الحدث', {
                    invalidArgs: args.eventId
                });
            }
        }
    },
    Subscription: {
        eventAdded: {
            subscribe: () => pubsub.asyncIterator(['EVENT_ADDED'])
        }
    }
};

module.exports = { eventResolvers };