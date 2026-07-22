const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/purchase/PUR73Y2627'); // wait, the backend is likely on 5000
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
test();
