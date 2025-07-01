// routes/portalbot-send.js
const fs = require('fs').promises;
const path = require('path');

const PORTALBOT_FILE = path.join(__dirname, '..', 'portalbot.json');

module.exports = {
  get: async (req, res) => {
    let cfg = {};
    try {
      const raw = await fs.readFile(PORTALBOT_FILE, 'utf-8');
      cfg = JSON.parse(raw);
    } catch {
    }
    const { id_telegram, id_botTele, waktu } = cfg;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = waktu ? new Date(waktu) : today;
    if (today.getTime() >= expiryDate.getTime()) {

      return res.send(
        `<script>
           alert('API server anda limit silahkan melakukan perpanjang');
           document.location='/expired';
         </script>`
      );
    }

    const text = req.query.text;
    if (!text) {
      return res.status(400).json({
        ok: false,
        error_code: 400,
        description: 'Status API: Aktif'
      });
    }

    const baseUrl = `https://api.telegram.org/bot${id_botTele}/sendMessage`;
    const params = new URLSearchParams({
      chat_id: id_telegram,
      text
    });
    if (req.query.parse_mode) {
      params.append('parse_mode', req.query.parse_mode);
    }
    const telegramUrl = `${baseUrl}?${params.toString()}`;

    try {
      const response = await fetch(telegramUrl);
      const body = await response.text();
      res
        .status(response.status)
        .contentType('application/json')
        .send(body);
    } catch (err) {
      const code = err.code || '';
      res.status(502).json({
        ok: false,
        error_code: 502,
        description: `Status API: Aktif✅ (${code}): ${err.message}`
      });
    }
  }
};
