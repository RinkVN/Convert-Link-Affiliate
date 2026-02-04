import express from 'express';
import { Link } from '../models/Link.js';
import { Event } from '../models/Event.js';

const router = express.Router();

// Route cho short link: /s/:shortId
router.get('/s/:shortId', async (req, res, next) => {
  try {
    const { shortId } = req.params;
    const link = await Link.findOne({ shortId }).lean().exec();
    if (!link) {
      return res.status(404).send('Link not found');
    }
    await Event.create({
      type: 'click',
      linkId: link._id.toString(),
      subId: link.subId
    });
    return res.redirect(302, link.affiliateUrl);
  } catch (err) {
    next(err);
  }
});

// Route cho tracking link cũ: /r/:id (MongoDB ObjectId)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const link = await Link.findById(id).lean().exec();
    if (!link) {
      return res.status(404).send('Link not found');
    }
    await Event.create({
      type: 'click',
      linkId: id,
      subId: link.subId
    });
    return res.redirect(302, link.affiliateUrl);
  } catch (err) {
    next(err);
  }
});

export default router;
