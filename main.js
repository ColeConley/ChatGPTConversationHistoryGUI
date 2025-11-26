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

    let messages = [];

    if (data.mapping) {
        console.log("Detected mapping format with potential null root");

        const traverse = (nodeId) => {
            const node = data.mapping[nodeId];
            if (!node) return;

            if (node.message) {
                const msg = node.message;
                messages.push({
                    role: msg.author.role,
                    text: msg.content.parts.join("\n"),
                    timestamp: msg.create_time
                        ? new Date(msg.create_time * 1000).toLocaleString()
                        : ""
                });
            }

            if (node.children && node.children.length > 0) {
                node.children.forEach(childId => traverse(childId));
            }
        };

        // Start from root node
        traverse("client-created-root");

        // Sort by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    else if (Array.isArray(data.messages)) {
        console.log("Detected messages[] format");

        messages = data.messages.map(msg => ({
            role: msg.role,
            text: msg.content,
            timestamp: msg.create_time
                ? new Date(msg.create_time * 1000).toLocaleString()
                : ""
        }));
    } else {
        console.error("Unrecognized conversation structure", data);
        container.innerHTML = "<p style='color:red'>Invalid conversation file.</p>";
        return;
    }

    console.log("Messages parsed:", messages.length);

    // Render chat bubbles
    messages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.classList.add("message");
        bubble.classList.add(msg.role === "user" ? "user" : "assistant");
        bubble.textContent = msg.text;

        const time = document.createElement("div");
        time.classList.add("timestamp");
        time.textContent = msg.timestamp;

        const wrapper = document.createElement("div");
        wrapper.appendChild(bubble);
        wrapper.appendChild(time);

        container.appendChild(wrapper);
    });

    console.log("Render complete");
}

