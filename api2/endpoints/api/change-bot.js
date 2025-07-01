
const fs = require('fs').promises;
const path = require('path');


module.exports = {
  get: async (req, res) => {
    const { id_telegram, id_botTele } = req.query;

    if (!id_telegram || !id_botTele) {
      return res.send('400');
    }

    try {
      let cfg = {};
      try {
        const raw = await fs.readFile((path.join(__dirname, '../..', 'portalbot.json')), 'utf-8');
        cfg = JSON.parse(raw);
      } catch {
      }

      cfg.id_telegram = String(id_telegram);
      cfg.id_botTele  = String(id_botTele);

      await fs.writeFile((path.join(__dirname, '../..', 'portalbot.json')), JSON.stringify(cfg, null, 2), 'utf-8');

      return res.send('200');
    } catch (nats) {
      console.error( nats);
      return res.send('500');
    }
  }
};
