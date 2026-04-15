const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const mammoth = require('mammoth');
const Document = require('../models/Document');

const User = require('../models/User');
const auth = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

router.use(auth);

// Get all docs for user (owned + shared)
router.get('/', async (req, res) => {
    try {
        const docs = await Document.find({
            $or: [{ owner: req.user }, { sharedWith: req.user }]
        })
        .populate('owner', 'email')
        .sort({ updatedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single doc
router.get('/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('owner', 'email')
            .populate('comments.user', 'email');
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!doc.owner.equals(req.user) && !doc.sharedWith.some(id => id.equals(req.user))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create doc
router.post('/', async (req, res) => {
    try {
        const doc = new Document({
            title: req.body.title || 'Untitled Document',
            content: req.body.content || '',
            owner: req.user,
            sharedWith: []
        });
        await doc.save();
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update doc
router.put('/:id', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        
        // Owner or shared can edit content/title
        if (!doc.owner.equals(req.user) && !doc.sharedWith.some(id => id.equals(req.user))) {
             return res.status(403).json({ error: 'Access denied' });
        }

        // Versioning logic: Save previous version if content changed and last save was > 1 min ago
        if (req.body.content !== undefined && doc.content !== req.body.content) {
            const timeSinceLastVersion = doc.versions.length > 0 
                ? (Date.now() - new Date(doc.versions[doc.versions.length - 1].savedAt).getTime()) 
                : Infinity;
            
            if (timeSinceLastVersion > 60000) { // 1 minute debouncing
                doc.versions.push({ content: doc.content });
            }
        }

        if (req.body.title !== undefined) doc.title = req.body.title;
        if (req.body.content !== undefined) doc.content = req.body.content;
        
        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Share doc
router.put('/:id/share', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        
        if (!doc.owner.equals(req.user)) {
             return res.status(403).json({ error: 'Only owner can share' });
        }

        const { email } = req.body;
        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) {
             return res.status(404).json({ error: 'User not found with this email' });
        }

        if (!doc.sharedWith.includes(userToShareWith._id)) {
            doc.sharedWith.push(userToShareWith._id);
            await doc.save();
        }
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Comment
router.post('/:id/comments', async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!doc.owner.equals(req.user) && !doc.sharedWith.some(id => id.equals(req.user))) {
             return res.status(403).json({ error: 'Access denied' });
        }

        doc.comments.push({ text: req.body.text, user: req.user });
        await doc.save();
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload and parse file route
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        let htmlContent = '';
        
        if (req.file.originalname.endsWith('.docx')) {
            const result = await mammoth.convertToHtml({path: req.file.path});
            htmlContent = result.value;
        } else {
            const content = fs.readFileSync(req.file.path, 'utf-8');
            htmlContent = content.split('\n').map(line => `<p>${line}</p>`).join('');
        }
        
        fs.unlinkSync(req.file.path); // clean up

        const doc = new Document({
            title: req.file.originalname,
            content: htmlContent,
            owner: req.user,
            sharedWith: []
        });
        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
