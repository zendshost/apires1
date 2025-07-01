const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const _pricelist_path = path.join(__dirname, 'pricelist.json');
const _trx_path = path.join(__dirname, 'transactions.json');

module.exports = {
  post: async (req, res) => {
    try {

      let pricelistRaw;
      try {
        pricelistRaw = await fs.readFile(_pricelist_path, 'utf-8');
      } catch {
        return res.status(500).json({ error: 'Gagal baca pricelist.' });
      }
      const pricelist = JSON.parse(pricelistRaw);
      const productId = req.body.id;
      if (!productId) {
        return res.status(400).json({ error: 'Tolong lampirkan field id pada body.' });
      }
      const product = pricelist.find(item => item.id === productId);
      if (!product) {
        return res.status(400).json({ error: 'ID produk tidak valid.' });
      }

      const resgateway = await fetch('https://gateway.okeconnect.com/api/mutasi/qris/OK1221366/906229617423034491221366OKCT128F940FBC9F7191CF068DC9B3FE9845');
      const json = await resgateway.json();
      const mutations = Array.isArray(json?.data)
        ? json.data.map(trans => String(trans.amount))
        : [];

      let existingTransactions = [];
      try {
        const trxRaw = await fs.readFile(_trx_path, 'utf-8');
        existingTransactions = JSON.parse(trxRaw);
      } catch {
        existingTransactions = [];
      }
      const usedPrices = new Set(existingTransactions.map(tx => String(tx.price)));

      let incremented_price = parseInt(product.price, 10);
      while (mutations.includes(String(incremented_price)) || usedPrices.has(String(incremented_price))) {
        incremented_price++;
      }

      const transaction = {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        price: incremented_price,
        status: 'Pending',
        duration: product.duration,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      existingTransactions.push(transaction);
      await fs.writeFile(_trx_path, JSON.stringify(existingTransactions, null, 2), 'utf-8');

      res.json({ success: true, transaction });

    } catch (nats) {
      console.error(nats);
      res.status(500).json({ error: 'Upps, an internal error occured, pwease report this error with aditional detail to owner.' });
    }
  }
};
