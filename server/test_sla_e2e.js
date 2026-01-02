const axios = require('axios');

const testSLA = async () => {
    try {
        console.log("Testing SLA Retrieval...");

        // 1. Create a Mock Ticket (since we might not have one easily accessible)
        // Or better, just mock the logic? No, let's try to hit the SLA logic directly if possible, 
        // but it requires a ticket ID.
        // Let's create a ticket first.

        // We need a running server for this.
        const API_URL = 'http://localhost:5000/api/tickets';

        console.log("Creating Test Ticket...");
        const ticketRes = await axios.post(`${API_URL}/report`, {
            userDescription: "There is a large pothole on Main Street causing traffic.",
            lat: 12.9716,
            lng: 77.5946,
            address: "Main St, Bangalore",
            name: "Test User",
            contact: "555-0199",
            email: "test@example.com",
            // Mocking the analysis part if image not provided, or purely relying on text
            routingData: JSON.stringify({ department: "Infrastructure" })
        });

        const ticketId = ticketRes.data.data._id;
        console.log(`Ticket Created: ${ticketId}`);

        // CHECK IMMEDIATE SLA
        console.log("Checking Immediate SLA in Creation Response...");
        if (ticketRes.data.data.sla && ticketRes.data.data.sla.policyReference) {
            console.log("✅ Immediate SLA Found!");
            console.log("   Policy:", ticketRes.data.data.sla.policyReference);
            console.log("   Date:", ticketRes.data.data.sla.expectedResolutionDate);
        } else {
            console.warn("⚠️ Immediate SLA NOT found in creation response. (It might be calculated async or logic failed)");
        }

        // 2. Fetch SLA (To double check persistence)
        console.log(`Fetching SLA for Ticket ${ticketId}...`);
        const slaRes = await axios.get(`${API_URL}/${ticketId}/sla`);

        if (slaRes.data.success) {
            console.log("\n✅ SLA Retrieval Successful!");
            console.log("------------------------------------------------");
            console.log("Expected Resolution:", slaRes.data.sla.expectedResolutionDate);
            console.log("Policy Reference:", slaRes.data.sla.slaReferenced.section);
            console.log("Duration:", slaRes.data.sla.slaReferenced.duration, slaRes.data.sla.slaReferenced.unit);
            console.log("Explanation:", slaRes.data.sla.explanation);
            console.log("------------------------------------------------\n");
        } else {
            console.error("❌ SLA Retrieval Failed:", slaRes.data);
        }

    } catch (error) {
        console.error("Test Error:", error.response ? error.response.data : error.message);
    }
};

testSLA();
