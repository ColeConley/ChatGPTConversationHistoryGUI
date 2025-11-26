let conversations = []; // Store all conversations globally
const MESSAGES_PER_BATCH = 50; // Number of messages to render per batch

// File input handler
document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            console.log("JSON loaded:", json);

            // Store conversations (array) globally
            conversations = Array.isArray(json) ? json : [json];

            renderConversationList(conversations);

            // Optionally display the first conversation initially
            if (conversations.length > 0) {
                renderConversation(conversations[0]);
                setActiveConversation(0);
            }

        } catch (err) {
            console.error("JSON parse error:", err);
            alert("Error parsing JSON. Check console.");
        }
    };
    reader.readAsText(file);
});

// Render the list of conversations in the left panel
function renderConversationList(conversations) {
    const listContainer = document.getElementById("conversationList");
    listContainer.innerHTML = "";

    conversations.forEach((conv, index) => {
        const item = document.createElement("div");
        item.classList.add("conversationItem");
        item.textContent = conv.title || `Conversation ${index+1}`;

        item.addEventListener("click", () => {
            renderConversation(conv);
            setActiveConversation(index);
        });

        listContainer.appendChild(item);
    });
}

function setActiveConversation(activeIndex) {
    const items = document.querySelectorAll(".conversationItem");
    items.forEach((el, idx) => {
        el.classList.toggle("active", idx === activeIndex);
    });
}

// Render a single conversation with lazy loading
function renderConversation(data) {
    console.log("Rendering conversation:", data.title);

    const container = document.getElementById("chatContainer");
    container.innerHTML = "";

    let messages = [];

    if (data.mapping) {
        const traverse = (nodeId) => {
            const node = data.mapping[nodeId];
            if (!node) return;

            if (node.message && node.message.content && node.message.content.parts) {
                const msg = node.message;
                if (!msg.metadata?.is_visually_hidden_from_conversation) {
                    messages.push({
                        role: msg.author.role,
                        text: msg.content.parts.join("\n"),
                        timestamp: msg.create_time
                            ? new Date(msg.create_time * 1000).toLocaleString()
                            : ""
                    });
                }
            }

            if (node.children && node.children.length > 0) {
                node.children.forEach(childId => traverse(childId));
            }
        };

        Object.values(data.mapping).forEach(node => {
            if (!node.parent) traverse(node.id);
        });

        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (Array.isArray(data.messages)) {
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

    console.log("Total messages:", messages.length);

    // Lazy loading logic
    let startIndex = Math.max(0, messages.length - MESSAGES_PER_BATCH);

    const renderBatch = (fromIndex, toIndex, prepend = false) => {
        const fragment = document.createDocumentFragment();
        for (let i = fromIndex; i < toIndex; i++) {
            const msg = messages[i];
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

            fragment.appendChild(wrapper);
        }

        if (prepend) {
            container.prepend(fragment);
        } else {
            container.appendChild(fragment);
        }
    };

    // Initial render (latest batch)
    renderBatch(startIndex, messages.length);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Lazy load older messages on scroll
    container.onscroll = () => {
        if (container.scrollTop === 0 && startIndex > 0) {
            const newStart = Math.max(0, startIndex - MESSAGES_PER_BATCH);
            renderBatch(newStart, startIndex, true);
            startIndex = newStart;

            // Maintain scroll position so content doesn't jump
            container.scrollTop = 1;
        }
    };
}
