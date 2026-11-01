// ดึงราคาหุ้น/อัตราแลกเปลี่ยนจาก Yahoo Finance ฝั่งเซิร์ฟเวอร์ (เบราว์เซอร์เรียกตรงไม่ได้เพราะติด CORS)
// ใช้: /.netlify/functions/quote?s=PTT.BK,AAPL,THB=X   (ราคาตลาดไทยอาจช้าราว 15 นาที)
const H = { 'User-Agent': 'Mozilla/5.0 (compatible; income-expense-app)', 'Accept': 'application/json' };
async function one(sym) {
  for (const host of ['query1', 'query2']) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`, { headers: H });
      if (!r.ok) continue;
      const j = await r.json();
      const m = j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
      if (!m || typeof m.regularMarketPrice !== 'number') continue;
      return {
        price: m.regularMarketPrice,
        cur: m.currency,
        prev: typeof m.chartPreviousClose === 'number' ? m.chartPreviousClose : (m.previousClose || null),
        time: (m.regularMarketTime || 0) * 1000,
        name: m.shortName || m.longName || sym
      };
    } catch (e) { /* ลองโฮสต์ถัดไป */ }
  }
  return null;
}
exports.handler = async (ev) => {
  const syms = [...new Set(((ev.queryStringParameters || {}).s || '').split(',').map(s => s.trim()).filter(s => /^[A-Za-z0-9.\-=^]{1,20}$/.test(s)))].slice(0, 30);
  const out = {};
  await Promise.all(syms.map(async s => { out[s] = await one(s); }));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=0, s-maxage=30' },
    body: JSON.stringify(out)
  };
};
