console.log("main.js loaded");

document.getElementById("fileInput").addEventListener("change", function(event) {
    console.log("File selected");

    const file = event.target.files[0];

    if (!file) {
        console.log("No file found");
        return;
    }

    console.log("Reading file:", file.name);

    const reader = new FileReader();

    reader.onload = function(e) {
        console.log("File loaded, parsing JSON...");

        try {
            const json = JSON.parse(e.target.result);
            console.log("JSON parsed successfully:", json);
            renderConversation(json);
        } catch (err) {
            console.error("JSON parse error:", err);
            alert("Error parsing JSON. Check console.");
        }
    };

    reader.onerror = function() {
        console.error("FileReader error:", reader.error);
    };

    reader.readAsText(file);
});


function renderConversation(data) {
    console.log("renderConversation called");
    
    const container = document.getElementById("chatContainer");
    container.innerHTML = "";

    if (!data.mapping) {
        console.error("No mapping field in JSON");
        container.innerHTML = "<p style='color:red'>Invalid conversation file.</p>";
        return;
    }

    const messages = Object.values(data.mapping)
        .filter(m => m.message)
        .sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));

    console.log("Messages found:", messages.length);

    messages.forEach(msg => {
        const role = msg.message.author.role;
        const text = msg.message.content.parts.join("\n");
        const timestamp = msg.message.create_time
            ? new Date(msg.message.create_time * 1000).toLocaleString()
            : "";

        const bubble = document.createElement("div");
        bubble.classList.add("message");
        bubble.classList.add(role === "user" ? "user" : "assistant");
        bubble.textContent = text;

        const time = document.createElement("div");
        time.classList.add("timestamp");
        time.textContent = timestamp;

        const wrapper = document.createElement("div");
        wrapper.appendChild(bubble);
        wrapper.appendChild(time);

        container.appendChild(wrapper);
    });

    console.log("Render complete");
}
