document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            console.log("JSON loaded:", json);

            // If array, take the first conversation
            const conversation = Array.isArray(json) ? json[0] : json;
            renderConversation(conversation);
        } catch (err) {
            console.error("JSON parse error:", err);
            alert("Error parsing JSON. Check console.");
        }
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

            if (node.message && node.message.content && node.message.content.parts) {
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

        traverse("client-created-root");

        // Sort messages by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (Array.isArray(data.messages)) {
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
