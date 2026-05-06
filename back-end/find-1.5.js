const apiKey = "AIzaSyBMSmsHLDTCHO6V1kMFkL_JFVWC4Rtx9dc";

async function list() {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await resp.json();
        if (data.models) {
            const v15Models = data.models.filter(m => m.name.includes("1.5")).map(m => m.name);
            console.log("1.5 Models:", v15Models);
        }
    } catch (e) { }
}

list();
