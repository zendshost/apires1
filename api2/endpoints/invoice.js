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
    const expiry = waktu ? new Date(waktu) : today;
    if (today.getTime() >= expiry.getTime()) {
      return res.send(`
        <script>
          alert('Anda Belum Melakukan Pembayaran');
          document.location = '/payment-server-agencode9432K2';
        </script>
      `);
    }

    return res.render('invoice', {
      id_telegram,
      id_botTele,
      expiry: waktu
    });
  }
};
