const fs = require('fs/promises')

module.exports = {
    get: async(req, res) => {
         let expiryDate;
  try {
    const raw = await fs.readFile((path.join(__dirname, '..', 'portalbot.json')), 'utf-8');
    const cfg = JSON.parse(raw);
    expiryDate = cfg.waktu;
  } catch {

    expiryDate = new Date().toISOString().slice(0, 10);
  }
  res.render('expired', { expiry: expiryDate });
    }
}