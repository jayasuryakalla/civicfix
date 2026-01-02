const { embedText } = require('./services/geminiService');
const fs = require('fs');
const path = require('path');

const run = async () => {
    try {
        console.log("Starting simple seed...");

        const dummyText = "Test Pothole";
        console.log("Embedding:", dummyText);

        const vec = await embedText(dummyText);
        console.log("Vector length:", vec.length);

        const outPath = path.join(__dirname, 'data/simple_test.json');
        fs.writeFileSync(outPath, JSON.stringify({ vec }));
        console.log("Written to:", outPath);

    } catch (e) {
        console.error("ERROR:", e);
    }
};

run();
