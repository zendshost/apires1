
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  get: async (req, res) => {
    try {
      let raw;
      try {
        raw = await fs.readFile((path.join(__dirname, 'api', 'transactions.json')), 'utf-8');
      } catch {
        return res
          .status(404)
          .json({ error: 'Upps, application encountered an error due missing or malformed json data' });
      }

      const transactions = JSON.parse(raw);

      const transactionId = req.query.id;
      if (!transactionId) {
        return res
          .status(400)
          .json({ error: 'Pwease provide an id as transaction id' });
      }

      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        return res
          .status(404)
          .json({ error: 'Upps, transaction not found' });
      }

      if (transaction.status === 'Success') {
        return res.status(200).json({
          message: 'Transaksi sudah dinyatakan sukses.',
          product_name: transaction.product_name,
          price: transaction.price,
          duration: transaction.duration,
          status_redirect: true
        });
      }

      if (transaction.status !== 'Pending') {
        return res
          .status(400)
          .json({ error: 'Transaksi sudah expired atau dibatalkan.' });
      }

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checkout</title>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #74ABE2, #5563DE); margin:0; padding:20px; display:flex; justify-content:center; align-items:center; min-height:100vh; color:#333; transition: background .3s, color .3s; }
    .container { background:#fff; border-radius:10px; padding:30px; box-shadow:0 4px 15px rgba(0,0,0,0.2); text-align:center; max-width:400px; width:100%; transition: background .3s, box-shadow .3s, color .3s; }
    h1 { margin-bottom:20px; color:#5563DE; }
    p { font-size:16px; line-height:1.6; margin:10px 0; }
    .qris { margin:20px 0; }
    .qris img { max-width:100%; border-radius:8px; }
    body.dark { background:#121212; color:#e0e0e0; }
    body.dark .container { background:#1e1e1e; box-shadow:0 4px 15px rgba(255,255,255,0.1); color:#e0e0e0; }
    body.dark h1 { color:#bb86fc; }
    .dark-mode-toggle { position:fixed; top:20px; right:20px; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; width:50px; height:50px; }
    .icon { width:40px; height:40px; transition: transform .5s ease, opacity .5s ease; }
    .hidden { opacity:0; position:absolute; }
    .dark-mode-toggle .icon { transform:rotate(0deg); }
    .dark-mode-toggle.active .icon { transform:rotate(360deg); }
  </style>
</head>
<body>
  <button id="darkModeToggle" class="dark-mode-toggle">
    <svg id="iconSun" class="icon" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/>
    </svg>
    <svg id="iconMoon" class="icon hidden" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 1021 12.79z"></path>
    </svg>
  </button>

  <div class="container">
    <h1>𝔃𝓮𝓷𝓭𝓼𝓱𝓸𝓼𝓽🚀</h1>
    <p>📦Produk: <span id="productName">${transaction.product_name}</span></p>
    <p>💰Harga: Rp<span id="productPrice">${transaction.price.toLocaleString('id-ID')}</span></p>
    <p>⏰Durasi: <span id="productDuration">${transaction.duration}</span> hari</p>
    
    <h3>QRIS All Payment✅</h3>
    <div class="qris">
      <img id="qrisku" alt="QRIS akan muncul di sini" width="300">
    </div>
    
    <p style="color:red;"><strong>Harap Di Baca! Silakan lakukan pembayaran. Status akan dicek otomatis.</strong></p>
    <div id="paymentStatusMessage"><p>Menunggu pembayaran...</p></div>
  </div>

  <script>
    function setTheme(theme) {
      document.body.classList.toggle('dark', theme === 'dark');
      document.getElementById('iconSun').classList.toggle('hidden', theme === 'dark');
      document.getElementById('iconMoon').classList.toggle('hidden', theme === 'light');
      document.getElementById('darkModeToggle').classList.add('active');
      setTimeout(() => document.getElementById('darkModeToggle').classList.remove('active'), 500);
      localStorage.setItem('theme', theme);
    }
    const saved = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(saved);
    document.getElementById('darkModeToggle').addEventListener('click', () =>
      setTheme(document.body.classList.contains('dark') ? 'light' : 'dark')
    );

    const transactionId = '${transaction.id}';
    let interval;
    const msgDiv = document.getElementById('paymentStatusMessage');
    
    function yumeiroAlreadyCompleted(data) {
      msgDiv.innerHTML = \`<p style="color:orange;">\${data.message}</p>\`;
      Swal.fire({icon:'info',title:'Informasi Transaksi',text:data.message+' Anda akan dialihkan.',timer:3500,showConfirmButton:false})
        .then(() => window.location.href='payment-server-agencode9432K2');
    }

    function checkStatus() {
      fetch(\`/api/check-status?id=\${transactionId}\`)
        .then(r => r.json().then(data => ({ status: r.status, data })))
        .then(({ status, data }) => {
          if (status === 200 && data.status_redirect) {
            clearInterval(interval);
            return yumeiroAlreadyCompleted(data);
          }
          if (data.error) {
            if (data.error.includes('expired')) {
              clearInterval(interval);
              Swal.fire({icon:'warning',title:'Transaksi Expired',text:data.error});
            }
            msgDiv.innerHTML = \`<p style="color:red;">\${data.error || data.status}</p>\`;
          } else if (data.status === 'Success') {
            clearInterval(interval);
            Swal.fire({icon:'success',title:'Pembayaran Berhasil!',text:'Transaksi sukses, dialihkan✅',timer:3000,showConfirmButton:false})
              .then(() => window.location.href='invoice');
          } else {
            msgDiv.innerHTML = \`<p>♻️Status: \${data.status}</p>\`;
          }
        })
        .catch(() => {
          msgDiv.innerHTML = '<p style="color:red;">Gagal cek status, mencoba ulang...</p>';
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
      fetch(\`/api/check-status?id=\${transactionId}\`, { headers: { Accept:'application/json' } })
        .then(r => r.json())
        .then(data => {
          if (data.status_redirect) return yumeiroAlreadyCompleted(data);
          checkStatus();
          interval = setInterval(checkStatus, 5000);
        })
        .catch(() => {
          checkStatus();
          interval = setInterval(checkStatus, 5000);
        });
    });

    // Fetch QR code
    const harga = ${transaction.price};
    fetch(\`https://zendshost.vercel.app/orderkuota/createpayment?apikey=ZendsHost&amount=\${harga}&codeqr=00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214552030555743290303UMI51440014ID.CO.QRIS.WWW0215ID20232699374880303UMI5204481253033605802ID5919RAISYA%2077%20OK12213666007CILEGON61054241162070703A016304D9E8\`)
      .then(r => r.json())
      .then(d => {
        if (d.result?.imageqris?.url) {
          document.getElementById('qrisku').src = d.result.imageqris.url;
        } else alert('Gagal mengambil QR.');
      })
      .catch(() => alert('Error ambil QR.'));
  </script>
</body>
</html>`;

      res.send(html);
    } catch (err) {
      res.status(500).json({ error: 'Terjadi kesalahan pada server.', detail: err.message });
    }
  }
};
