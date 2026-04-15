const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true, default: 'Untitled Document' },
    content: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    versions: [{ 
        content: String, 
        savedAt: { type: Date, default: Date.now } 
    }],
    comments: [{ 
        text: String, 
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolved: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now } 
    }]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
