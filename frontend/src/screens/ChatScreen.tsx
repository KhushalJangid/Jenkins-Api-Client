import { CircularProgress } from "@mui/joy";
import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../models/Api";

export interface Message {
  sender: "user" | "model";
  text: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const userMessage: Message = { sender: "user", text: input };
    let newMsg = [...messages, userMessage]
    setMessages(newMsg);
    setInput("");
    console.log("messages",messages);

    const aiMessage: Message = {
      sender: "model",
      text: await sendMessage(newMsg),
    };
    setMessages((prev) => [...prev, aiMessage]);
    setLoading(false)
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleMessage();
    }
  };

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-3 m-3"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="bg-body border rounded p-3 mb-3 w-100"
        style={{
          maxWidth: 600,
          height: 400,
          overflowY: "auto",
          background: "#f9f9f9",
        }}
      >
        {messages.length === 0 && (
          <div className="text-muted text-center">Start the conversation!</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 d-flex ${
              msg.sender === "user"
                ? "justify-content-end"
                : "justify-content-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded ${
                msg.sender === "user"
                  ? "bg-primary text-white"
                  : "bg-body border"
              }`}
              style={{ maxWidth: "75%" }}
            >
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
        <button
          className="btn btn-primary"
          onClick={handleMessage}
          disabled={!input.trim() || loading}
        >
          {loading ? <CircularProgress size="sm"/> : "Send"}
        </button>
      </div>
    </div>
  );
}
