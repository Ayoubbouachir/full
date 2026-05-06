const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const apiKey = "AIzaSyBMSmsHLDTCHO6V1kMFkL_JFVWC4Rtx9dc";
    const genAI = new GoogleGenerativeAI(apiKey);

    const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite"];

    for (const modelName of models) {
        console.log(`Testing model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`Success with ${modelName}:`, response.text());
            return; // Stop if success
        } catch (e) {
            console.error(`Error with ${modelName}:`, e.message);
        }
    }
}

test();
