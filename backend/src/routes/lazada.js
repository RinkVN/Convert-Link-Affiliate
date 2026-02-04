import express from 'express';
import { Link } from '../models/Link.js';
import { createTrackingLink } from '../services/accesstradeClient.js';
import { isLazadaUrl, normalizeUrl, getClientIp, generateShortId } from '../utils/urlUtils.js';

const router = express.Router();

router.post('/convert', async (req, res) => {
  try {
    const { originalUrl, subId } = req.body || {};

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res
        .status(400)
        .json({ error: 'originalUrl is required and must be a string' });
    }

    if (subId != null && typeof subId !== 'string') {
      return res.status(400).json({ error: 'subId must be a string if provided' });
    }

    if (!isLazadaUrl(originalUrl)) {
      return res.status(400).json({
        error: 'URL must be một link Lazada hợp lệ (lazada.vn)',
      });
    }

    const normalizedUrl = normalizeUrl(originalUrl);

    const lazadaCampaignId = process.env.ACCESSTRADE_LAZADA_CAMPAIGN_ID?.trim();

    const { affiliateUrl, shortLink, rawResponse } = await createTrackingLink({
      originalUrl,
      normalizedUrl,
      subId,
      campaignId: lazadaCampaignId,
    });

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    // Tạo shortId unique
    let shortId;
    let attempts = 0;
    do {
      shortId = generateShortId();
      const existing = await Link.findOne({ shortId }).lean();
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        shortId = undefined;
        break;
      }
    } while (true);

    const linkDoc = await Link.create({
      originalUrl,
      normalizedUrl,
      affiliateUrl,
      shortId,
      subId,
      ip,
      userAgent,
    });

    // Tạo short link từ domain của user
    const shortLinkDomain = process.env.SHORT_LINK_DOMAIN || 'hoantien.shopbnh.vn';
    const customShortLink = shortId ? `https://${shortLinkDomain}/s/${shortId}` : shortLink || affiliateUrl;

    const apiBase = process.env.API_BASE_URL || '';
    const clickTrackingUrl = apiBase
      ? `${apiBase.replace(/\/$/, '')}/r/${linkDoc._id}`
      : undefined;

    return res.json({
      id: linkDoc._id.toString(),
      affiliateUrl,
      shortLink: customShortLink,
      clickTrackingUrl: clickTrackingUrl || affiliateUrl,
      rawResponse,
    });
  } catch (err) {
    console.error('Error in /api/lazada/convert:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error:
        err.message || 'Internal server error while converting Lazada affiliate link',
    });
  }
});

export default router;

