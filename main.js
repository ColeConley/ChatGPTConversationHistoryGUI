let conversations = [];
let currentConversation = null;
const MESSAGES_PER_BATCH = 50;

// File upload
document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            conversations = Array.isArray(json) ? json : [json];
            renderConversationList(conversations);
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

// Render left panel conversation list
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
    items.forEach((el, idx) => el.classList.toggle("active", idx === activeIndex));
}

// Filter messages
function applyFilters(messages) {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const roleFilter = document.getElementById("roleFilter").value;

    return messages.filter(msg => {
        const matchesRole = roleFilter === "all" || msg.role === roleFilter;
        const matchesSearch = msg.text.toLowerCase().includes(searchTerm);
        return matchesRole && matchesSearch;
    });
}

// Render conversation with top-first lazy loading
function renderConversation(data) {
    currentConversation = data;
    const container = document.getElementById("chatContainer");
    container.innerHTML = "";

    let messages = [];

    // Parse mapping
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
        container.innerHTML = "<p style='color:red'>Invalid conversation file.</p>";
        return;
    }

    messages = applyFilters(messages);
    console.log("Total messages after filter:", messages.length);

    let startIndex = 0;
    let endIndex = Math.min(MESSAGES_PER_BATCH, messages.length);

    const renderBatch = (fromIndex, toIndex, append = true) => {
        const fragment = document.createDocumentFragment();
        for (let i = fromIndex; i < toIndex; i++) {
            const msg = messages[i];
            const bubble = document.createElement("div");
            bubble.classList.add("message", msg.role === "user" ? "user" : "assistant");
            bubble.textContent = msg.text;

            const time = document.createElement("div");
            time.classList.add("timestamp");
            time.textContent = msg.timestamp;

            const wrapper = document.createElement("div");
            wrapper.appendChild(bubble);
            wrapper.appendChild(time);

            fragment.appendChild(wrapper);
        }
        if (append) container.appendChild(fragment);
        else container.prepend(fragment);
    };

    // Initial render (top batch)
    renderBatch(startIndex, endIndex);
    container.scrollTop = 0;

    // Lazy load newer messages on scroll
    container.onscroll = () => {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1 && endIndex < messages.length) {
            const newEnd = Math.min(messages.length, endIndex + MESSAGES_PER_BATCH);
            renderBatch(endIndex, newEnd, true);
            endIndex = newEnd;
        }
    };
}

// Quick Actions
document.getElementById("exportJson").addEventListener("click", () => {
    if (!currentConversation) return;
    const blob = new Blob([JSON.stringify(currentConversation, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentConversation.title || "conversation"}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById("copyMessages").addEventListener("click", () => {
    if (!currentConversation) return;
    const allText = currentConversation.messages ? currentConversation.messages.map(m => m.content).join("\n") : "";
    navigator.clipboard.writeText(allText).then(() => alert("Messages copied to clipboard!"));
});

document.getElementById("downloadMessages").addEventListener("click", () => {
    if (!currentConversation) return;
    const messages = currentConversation.messages || [];
    const filtered = applyFilters(messages);
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentConversation.title || "messages_filtered"}.json`;
    a.click();
    URL.revokeObjectURL(url);
});
