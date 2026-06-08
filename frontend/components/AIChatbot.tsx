import React, { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  isStreaming?: boolean;
}

interface AIChatbotProps {
  activeAlgorithmName?: string;
}

export default function AIChatbot({ activeAlgorithmName }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: '你好！我是你的 AI 機器學習助教。不論你在建模流程（問題定義、特徵工程、模型評估等）遇到什麼問題，或是想探討十大演算法的細節，都可以隨時問我喔！',
    },
  ]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [reconnectCount, setReconnectCount] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested questions based on ML themes
  const quickPrompts = [
    '如何開始一個機器學習建模流程？',
    '我的模型過擬合 (Overfitting) 了該怎麼辦？',
    '什麼是資料洩漏 (Data Leakage)？該如何避免？',
  ];

  // Initialize and maintain WebSocket connection
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connectWS = () => {
      setWsStatus('connecting');
      // Use configured WebSocket server url, default to standard local API websocket URL
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/ai-chat';
      
      console.log(`Connecting to AI Assistant WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to AI assistant WebSocket successfully.');
        setWsStatus('connected');
        setReconnectCount(0);
      };

      ws.onmessage = (event) => {
        setIsThinking(false);
        const chunk = event.data;

        if (chunk === '[DONE]') {
          // Finish current streaming message and lock typing state as finalized
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.sender === 'bot') {
              return [
                ...prev.slice(0, -1),
                { ...last, isStreaming: false }
              ];
            }
            return prev;
          });
          return;
        }

        // Append streaming text chunk to the current active bot reply bubble
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.sender === 'bot' && last.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, text: last.text + chunk }
            ];
          } else {
            return [
              ...prev,
              { sender: 'bot', text: chunk, isStreaming: true }
            ];
          }
        });
      };

      ws.onclose = (e) => {
        console.log('WebSocket connection closed:', e.code, e.reason);
        setWsStatus('disconnected');
        
        // Exponential backoff strategy for auto-reconnection
        const delay = Math.min(2000 * Math.pow(2, reconnectCount), 30000);
        console.log(`AI Assistant will attempt reconnection in ${delay}ms...`);
        reconnectTimer = setTimeout(() => {
          setReconnectCount((prev) => prev + 1);
          connectWS();
        }, delay);
      };

      ws.onerror = (err) => {
        console.error('WebSocket encountered an error:', err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, [reconnectCount]);

  // Keep chat scrolls pinned to bottom as new content flows in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle message dispatch
  const sendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    if (wsStatus !== 'connected') {
      alert('助教目前與伺服器斷開，正在重新連線中，請稍候再試。');
      return;
    }

    // Append user input locally
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setIsThinking(true);

    // Send payload through WebSocket with optional context
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        message: textToSend,
        algoContext: activeAlgorithmName || '',
      };
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`floatingChatBtn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="打開 AI 助教聊天室"
      >
        {isOpen ? (
          <span className="iconClose">✕</span>
        ) : (
          <div className="btnContent">
            <span className="iconMsg">💬</span>
            <span className="badgePulse" />
            <span className="btnText">AI 助教</span>
          </div>
        )}
      </button>

      {/* Chat Room Panel */}
      <div className={`chatWindow ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatHeader">
          <div className="headerLeft">
            <span className="statusDot" style={{
              background: wsStatus === 'connected' ? '#10b981' : wsStatus === 'connecting' ? '#f59e0b' : '#ef4444'
            }} />
            <div>
              <h3>AI 機器學習助教</h3>
              <span className="statusText">
                {wsStatus === 'connected' ? '已連線 (對話中)' : wsStatus === 'connecting' ? '連線中...' : '斷線重連中...'}
              </span>
            </div>
          </div>
          <button className="closeBtn" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        {/* Context info bar */}
        {activeAlgorithmName && (
          <div className="contextBar">
            💡 助教已為你載入 <strong>{activeAlgorithmName}</strong> 學習情境
          </div>
        )}

        {/* Messages view */}
        <div className="chatBody">
          {messages.map((msg, idx) => (
            <div key={idx} className={`msgRow ${msg.sender}`}>
              <div className="msgAvatar">
                {msg.sender === 'bot' ? '🤖' : '👤'}
              </div>
              <div className="msgBubble">
                <p className="msgText">{msg.text}</p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="msgRow bot thinking">
              <div className="msgAvatar">🤖</div>
              <div className="msgBubble thinkingBubble">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && !isThinking && (
          <div className="quickPrompts">
            <p className="promptTitle">你可能想問：</p>
            <div className="chipsContainer">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="promptChip"
                  onClick={() => handleQuickPromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <form className="chatFooter" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入機器學習問題（如：如何處理過擬合）..."
            disabled={wsStatus !== 'connected' || isThinking || (messages.length > 0 && messages[messages.length - 1].isStreaming)}
          />
          <button
            type="submit"
            disabled={!input.trim() || wsStatus !== 'connected' || isThinking || (messages.length > 0 && messages[messages.length - 1].isStreaming)}
          >
            傳送
          </button>
        </form>
      </div>

      <style jsx>{`
        /* Floating Button styling */
        .floatingChatBtn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
          color: #fff;
          padding: 12px 24px;
          box-shadow: 0 8px 30px rgba(79, 70, 229, 0.3);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .floatingChatBtn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4);
        }
        .floatingChatBtn.active {
          padding: 14px;
          background: var(--surface-soft);
          color: var(--text);
          border: 1px solid var(--line);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .btnContent {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        .iconMsg {
          font-size: 1.25rem;
        }
        .iconClose {
          font-size: 1.2rem;
          font-weight: bold;
        }
        .btnText {
          font-weight: 700;
          font-size: 0.95rem;
        }
        .badgePulse {
          position: absolute;
          left: -4px;
          top: -4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        /* Chat Window Drawer styling with Premium Glassmorphism */
        .chatWindow {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 380px;
          height: 520px;
          z-index: 998;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(30px) scale(0.95);
          opacity: 0;
          pointer-events: none;
        }
        :global(.dark) .chatWindow {
          background: rgba(17, 24, 39, 0.85);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .chatWindow.open {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }
        .chatHeader {
          padding: 14px 16px;
          background: var(--surface-soft);
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .headerLeft {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .statusDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: block;
        }
        .chatHeader h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text);
        }
        .statusText {
          font-size: 0.76rem;
          color: var(--muted);
        }
        .closeBtn {
          border: 0;
          background: transparent;
          font-size: 1.1rem;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
        }
        .closeBtn:hover {
          color: var(--text);
        }

        /* Context indicator bar */
        .contextBar {
          background: rgba(79, 70, 229, 0.08);
          border-bottom: 1px solid var(--line);
          padding: 8px 12px;
          font-size: 0.8rem;
          color: var(--text);
          text-align: center;
        }

        /* Message body styling */
        .chatBody {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .msgRow {
          display: flex;
          gap: 10px;
          max-width: 85%;
        }
        .msgRow.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .msgRow.bot {
          align-self: flex-start;
        }
        .msgAvatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-soft);
          display: grid;
          place-items: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          border: 1px solid var(--line);
        }
        .msgBubble {
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }
        .msgRow.user .msgBubble {
          background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
          color: #fff;
          border: 0;
        }
        .msgText {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        /* Thinking animation bubble */
        .thinkingBubble {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
        }
        .thinkingBubble .dot {
          width: 6px;
          height: 6px;
          background: var(--muted);
          border-radius: 50%;
          display: inline-block;
          animation: thinkBounce 1.4s infinite ease-in-out both;
        }
        .thinkingBubble .dot:nth-child(1) { animation-delay: -0.32s; }
        .thinkingBubble .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes thinkBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        /* Suggested question chips */
        .quickPrompts {
          padding: 0 16px 12px;
          background: transparent;
        }
        .promptTitle {
          margin: 0 0 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--muted);
        }
        .chipsContainer {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .promptChip {
          text-align: left;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.82rem;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }
        .promptChip:hover {
          background: var(--surface-soft);
          border-color: var(--accent);
          transform: translateX(3px);
        }

        /* Footer Input Area styling */
        .chatFooter {
          padding: 12px 16px;
          background: var(--surface-soft);
          border-top: 1px solid var(--line);
          display: flex;
          gap: 10px;
        }
        .chatFooter input {
          flex: 1;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 8px 12px;
          background: var(--surface);
          color: var(--text);
          font-family: inherit;
          font-size: 0.88rem;
        }
        .chatFooter input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .chatFooter button {
          border: 0;
          border-radius: 8px;
          background: var(--accent);
          color: #fff;
          padding: 8px 16px;
          font-weight: bold;
          font-size: 0.88rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .chatFooter button:hover:not(:disabled) {
          opacity: 0.9;
        }
        .chatFooter button:disabled {
          background: var(--muted);
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive styling for mobile */
        @media (max-width: 450px) {
          .chatWindow {
            width: calc(100% - 32px);
            right: 16px;
            left: 16px;
            bottom: 80px;
            height: calc(100vh - 120px);
          }
          .floatingChatBtn {
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </>
  );
}
