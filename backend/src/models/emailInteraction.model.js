import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        index: true
    },
    emailId: {
        type: String,
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['open', 'reply', 'star', 'delete', 'archive', 'snooze'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const EmailInteraction = mongoose.model('EmailInteraction', interactionSchema);

export default EmailInteraction;
