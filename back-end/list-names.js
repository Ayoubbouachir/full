const apiKey = "AIzaSyBMSmsHLDTCHO6V1kMFkL_JFVWC4Rtx9dc";

async function list() {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await resp.json();
        if (data.models) {
            console.log("Names:", data.models.map(m => m.name).join(", "));
        } else {
            console.log("Data:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

list();
