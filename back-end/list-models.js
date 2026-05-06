const { GoogleGenerativeAI } = require("@google/generative-ai");

async function list() {
    const apiKey = "AIzaSyBMSmsHLDTCHO6V1kMFkL_JFVWC4Rtx9dc";
    // We can't easily list models with the SDK without a weird workaround, 
    // let's try a direct fetch if possible or just try few more names.
    console.log("Testing direct fetch for models list...");
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await resp.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

list();
