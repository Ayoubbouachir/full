const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const apiKey = "AIzaSyBMSmsHLDTCHO6V1kMFkL_JFVWC4Rtx9dc";
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log("Success with gemini-1.0-pro:", response.text());
    } catch (e) {
        console.error("Error with gemini-1.0-pro:", e.message);
    }
}

test();
