const fs = require('fs').promises;
const path = require('path');
const TRANSACTIONS_FILE = path.join(__dirname,  'transactions.json');
const PORTALBOT_FILE    = path.join(__dirname,'../..', 'portalbot.json');

module.exports = {
  get: async (req, res) => {
    try {
      let raw;
      try {
        raw = await fs.readFile(TRANSACTIONS_FILE, 'utf-8');
      } catch {
        return res.status(404).json({ error: 'File transactions.json tidak ditemukan.' });
      }
      const transactions = JSON.parse(raw);

      const transactionId = req.query.id;
      if (!transactionId) {
        return res.status(400).json({ error: 'ID transaksi tidak diberikan.' });
      }
      const idx = transactions.findIndex(t => t.id === transactionId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      }

      const tx = transactions[idx];

      if (tx.status === 'Success') {
        return res.status(400).json({ error: 'Transaksi sudah selesai.' });
      }
      if (tx.status !== 'Pending') {
        return res.status(400).json({ error: 'Transaksi sudah expired atau dibatalkan.' });
      }

      const apiUrl = 'https://gateway.okeconnect.com/api/mutasi/qris/OK1221366/906229617423034491221366OKCT128F940FBC9F7191CF068DC9B3FE9845';
      const apiRes = await fetch(apiUrl);
      if (!apiRes.ok) {
        if (apiRes.status === 429) {
          return res.status(429).json({ error: 'Terlalu banyak request, mohon ulangi setelah beberapa saat' });
        }
        return res.status(500).json({ error: 'errorr :3' });
      }
      const data = await apiRes.json();

      let newStatus = 'Pending';
      if (data?.status === 'success' && Array.isArray(data.data)) {
        for (const p of data.data) {
          if (p.amount == tx.price && p.type === 'CR') {
            newStatus = 'Success';
            transactions[idx].status = 'Success';


            let baseDate = new Date();
            try {
              const botRaw = await fs.readFile(PORTALBOT_FILE, 'utf-8');
              const botCfg = JSON.parse(botRaw);
              if (botCfg.waktu && new Date(botCfg.waktu) > new Date()) {
                baseDate = new Date(botCfg.waktu);
              }
            } catch {
            }

            const durationDays = parseInt(tx.duration, 10);
            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() + durationDays);
            const yyyy = newDate.getFullYear();
            const mm = String(newDate.getMonth() + 1).padStart(2, '0');
            const dd = String(newDate.getDate()).padStart(2, '0');
            const formatted = `${yyyy}-${mm}-${dd}`;

            let idTelegram = 'gaoooooo';
            let idBotTele  = 'miawwww';
            try {
              const botRaw = await fs.readFile(PORTALBOT_FILE, 'utf-8');
              const botCfg = JSON.parse(botRaw);
              if (botCfg.id_telegram) idTelegram = botCfg.id_telegram;
              if (botCfg.id_botTele)  idBotTele  = botCfg.id_botTele;
            } catch {}

            const newBotCfg = { id_telegram: idTelegram, id_botTele: idBotTele, waktu: formatted };
            await fs.writeFile(PORTALBOT_FILE, JSON.stringify(newBotCfg, null, 2), 'utf-8');

            break;
          }
        }
      }

      await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2), 'utf-8');

      res.json({
        success: true,
        transaction_id: transactions[idx].id,
        product_name:   transactions[idx].product_name,
        price:          transactions[idx].price,
        duration:       transactions[idx].duration,
        status:         transactions[idx].status
      });

    } catch (err) {
      console.error('❌ Error check-status:', err);
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  }
};
