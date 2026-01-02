const axios = require('axios');

const testRouting = async () => {
    const issue = "There is a lot of water logging on the MG Road after the heavy rains yesterday. Sewer covers are overflowing.";

    console.log(`Testing Routing for: "${issue}"`);

    try {
        const res = await axios.post('http://localhost:5000/api/routing/analyze', {
            text: issue,
            lat: 12.9716,
            lng: 77.5946
        });

        if (res.data.success) {
            console.log("\n--- Routing Result ---");
            console.log("Department:", res.data.data.department);
            console.log("Method:", res.data.data.routingMethod);
            console.log("Reasoning:", res.data.data.reasoning);
            console.log("----------------------\n");
        } else {
            console.error("Routing Failed:", res.data.message);
        }
    } catch (err) {
        console.error("Request Error:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    }
};

testRouting();
