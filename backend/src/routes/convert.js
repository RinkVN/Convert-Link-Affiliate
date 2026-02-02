import express from 'express';
import axios from 'axios';
import { Link } from '../models/Link.js';
import { isShopeeUrl, normalizeUrl, getClientIp } from '../utils/urlUtils.js';
import { createTrackingLink } from '../services/accesstradeClient.js';

const router = express.Router();

async function resolveShortLinkIfNeeded(originalUrl) {
  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname;
    const shortDomains = ['vn.shp.ee', 's.shopee.vn'];

    if (!shortDomains.includes(hostname)) {
      return originalUrl;
    }

    // Try to resolve redirect without following automatically
    const resp = await axios.get(originalUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const redirectLocation = resp.headers.location;
    if (redirectLocation) {
      return redirectLocation;
    }

    return originalUrl;
  } catch (err) {
    console.warn('Failed to resolve short link, using original URL', err.message);
    return originalUrl;
  }
}

router.post('/', async (req, res, next) => {
  try {
    const { originalUrl, subId } = req.body || {};

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({ error: 'originalUrl is required and must be a string' });
    }

    if (subId && typeof subId !== 'string') {
      return res.status(400).json({ error: 'subId must be a string if provided' });
    }

    if (!isShopeeUrl(originalUrl)) {
      return res.status(400).json({
        error: 'URL must be a valid Shopee link (shopee.vn, vn.shp.ee, s.shopee.vn)'
      });
    }

    const resolvedUrl = await resolveShortLinkIfNeeded(originalUrl);
    const normalizedUrl = normalizeUrl(resolvedUrl);

    const { affiliateUrl } = await createTrackingLink({
      originalUrl,
      normalizedUrl,
      subId
    });

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const linkDoc = await Link.create({
      originalUrl,
      normalizedUrl,
      affiliateUrl,
      subId,
      ip,
      userAgent
    });

    return res.json({
      id: linkDoc._id.toString(),
      affiliateUrl
    });
  } catch (err) {
    console.error('Error in /api/convert:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Internal server error while converting link'
    });
  }
});

// Optional: recent links for frontend history display
router.get('/recent', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const links = await Link.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    res.json({
      data: links.map((l) => ({
        id: l._id.toString(),
        originalUrl: l.originalUrl,
        affiliateUrl: l.affiliateUrl,
        subId: l.subId,
        createdAt: l.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

export default router;

