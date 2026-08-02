const fs = require('fs');
const file = 'src/data/mockData.js';
let s = fs.readFileSync(file, 'utf8');
const map = [
  ['eq-001', 'photo-1517336714731-489689fd1ca8'],
  ['eq-002', 'photo-1524985069026-dd778a71c7b4'],
  ['eq-003', 'photo-1545454675-3531b543be5d'],
  ['eq-004', 'photo-1516035069371-29a1b244cc32'],
  ['eq-005', 'photo-1496181133206-80ce9b88a853'],
  ['eq-006', 'photo-1593642532974-d377ab507dc8'],
  ['eq-007', 'photo-1470225620780-dba8ba36b745'],
  ['eq-008', 'photo-1550439062-609e1531270e'],
  ['cafe-001', 'photo-1541519227354-08fa5d50c44d'],
  ['cafe-002', 'photo-1512621776951-a57141f2eefd'],
  ['cafe-003', 'photo-1495474472287-4d71bcdd2085'],
  ['cafe-004', 'photo-1528735602780-2552fd46c7af'],
  ['cafe-005', 'photo-1536256263959-770b48d82b0a'],
  ['cafe-006', 'photo-1562059390-a761a084768e'],
  ['cafe-007', 'photo-1553530666-ba11a7da3888'],
  ['cafe-008', 'photo-1540420773420-3366772f4999'],
  ['cafe-009', 'photo-1499636136210-6f4ee915583e'],
  ['cafe-010', 'photo-1621996346565-e3dbc646d9a9'],
  ['transit-001', 'photo-1544620347-c4fd4a3d5957'],
  ['transit-002', 'photo-1570125909232-eb263c188f7e'],
  ['transit-003', 'photo-1572025442646-866d16c84a54'],
  ['transit-004', 'photo-1558449028-b53a39d100fc'],
  ['transit-005', 'photo-1519501025264-65ba15a82390'],
  ['transit-006', 'photo-1503736334956-4c8f8e92946d'],
];
let missing = [];
map.forEach(([id, photo]) => {
  const url = 'https://images.unsplash.com/' + photo + '?auto=format&fit=crop&w=800&q=70';
  // equipment + cafe items already have imageUrl
  const reUrl = new RegExp("(id: '" + id + "',[\\s\\S]*?imageUrl: )'[^']*'", 'm');
  if (reUrl.test(s)) {
    s = s.replace(reUrl, '$1"' + url + '"');
    return;
  }
  // transit items: insert imageUrl after alerts array
  const reAlerts = new RegExp("(id: '" + id + "',[\\s\\S]*?alerts: \\[[^\\]]*\\],\\s*)", 'm');
  if (reAlerts.test(s)) {
    s = s.replace(reAlerts, '$1  imageUrl: "' + url + '",\n  ');
    return;
  }
  missing.push(id);
});
fs.writeFileSync(file, s);
console.log('done. missing:', missing.length ? missing.join(',') : 'none');
