const apiKey = "AIzaSyBMSmsHLDTCHO6V1kMFkL_JFVWC4Rtx9dc";

async function list() {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await resp.json();
        if (data.models) {
            const flashModels = data.models.filter(m => m.name.includes("flash")).map(m => m.name);
            console.log("Flash Models:", flashModels);
        }
    } catch (e) { }
}

list();
