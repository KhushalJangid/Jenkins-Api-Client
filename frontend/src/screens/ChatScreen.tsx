import { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "agent";
  text: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response (replace with real API call)
    setTimeout(() => {
      const aiMessage: Message = {
        sender: "agent",
        text: `AI: You said "${userMessage.text}"`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 800);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-3 m-3" style={{ minHeight: "80vh" }}>
      <div className="bg-body border rounded p-3 mb-3 w-100" style={{ maxWidth: 600, height: 400, overflowY: "auto", background: "#f9f9f9" }}>
        {messages.length === 0 && (
          <div className="text-muted text-center">Start the conversation!</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 d-flex ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}>
            <div className={`px-3 py-2 rounded ${msg.sender === "user" ? "bg-primary text-white" : "bg-body border"}`} style={{ maxWidth: "75%" }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="d-flex w-100" style={{ maxWidth: 600 }}>
        <input
          className="form-control me-2"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button className="btn btn-primary" onClick={sendMessage} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}