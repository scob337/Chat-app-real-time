const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Ensure message has either receiver (for direct) or group
messageSchema.pre('save', function(next) {
    if (!this.receiver && !this.group) {
        next(new Error('Message must have either a receiver or a group'));
    }
    if (this.receiver && this.group) {
        next(new Error('Message cannot have both receiver and group'));
    }
    next();
});

module.exports = mongoose.model('Message', messageSchema);
