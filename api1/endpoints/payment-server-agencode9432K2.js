const fs = require('fs').promises;
const path = require('path');


const USERNAME = 'MALYJFJ5SVD4';
const PASSWORD = 'NLG3PWAAAAAA';

const PORTALBOT_FILE = path.join(__dirname, '..', 'portalbot.json');

module.exports = {
  get: async (req, res) => {
    if (req.query.logout) {
      req.session.destroy(err => {
        return res.redirect(req.baseUrl + req.path);
      });
      return;
    }

    if (!req?.session?.isLoggedIn) {
      return res.render('login', { error: null });
    }

    if (req.query.get_status) {
      let cfg = {};
      try {
        const raw = await fs.readFile(PORTALBOT_FILE, 'utf-8');
        cfg = JSON.parse(raw);
      } catch {}
      return res.json({ expired_date: cfg.waktu });
    }


    let cfg = {};
    try {
      const raw = await fs.readFile(PORTALBOT_FILE, 'utf-8');
      cfg = JSON.parse(raw);
    } catch {}
    return res.render('admin', {
      id_telegram: cfg.id_telegram || '',
      id_botTele:  cfg.id_botTele  || '',
      expiry:      cfg.waktu       || new Date().toISOString().slice(0,10)
    });
  },

  post: (req, res) => {
    const { username, password } = req.body;
    if (username === USERNAME && password === PASSWORD) {
      req.session.isLoggedIn = true;
      return res.redirect(req.baseUrl + req.path);
    } else {
      return res.render('login', { error: 'Username atau Password salah!' });
    }
  }
};
