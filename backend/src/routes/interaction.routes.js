import express from 'express';
import EmailInteraction from '../models/emailInteraction.model.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { userEmail, emailId, eventType } = req.body;
        
        if (!userEmail || !emailId || !eventType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const validEvents = ['open', 'reply', 'star', 'delete', 'archive', 'snooze'];
        if (!validEvents.includes(eventType)) {
            return res.status(400).json({ error: 'Invalid eventType' });
        }

        const interaction = new EmailInteraction({
            userEmail,
            emailId,
            eventType
        });

        await interaction.save();
        res.status(201).json({ message: 'Interaction logged successfully', interaction });
    } catch (error) {
        console.error('Error logging interaction:', error);
        res.status(500).json({ error: 'Failed to log interaction' });
    }
});

export default router;
