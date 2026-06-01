// Root-level proxy — Vercel picks this up as /api/keeper-cron
module.exports = require('../frontend/api/keeper-cron').default ||
                 require('../frontend/api/keeper-cron');
