document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const json = JSON.parse(e.target.result);
        renderConversation(json);
    };

    reader.readAsText(file);
});

function renderConversation(data) {
    const container = document.getElementById("chatContainer");
    container.innerHTML = "";

    const messages = Object.values(data.mapping)
        .filter(m => m.message)
        .sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));

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
}
