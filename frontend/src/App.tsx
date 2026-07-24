import "./App.css";
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { readPDF } from "./utils/pdfReader";
import {
  Brain,
  UploadCloud,
  FileText,
  History,
  Save,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  Send
} from "lucide-react";
import type { RootState } from "./store/store";
import {
  setText,
  setDragActive,
  setSelectedFileName,
  setIsExtracting,
  setIsSaving,
  addToast,
  removeToast,
  setForm,
  updateFormField,
  resetForm,
  setComplaints,
  setChatInput,
  addChatMessage,
  clearChat,
  setIsChatting
} from "./store/complaintSlice";

function App() {
  const dispatch = useDispatch();

  const text = useSelector((state: RootState) => state.complaint.text);
  const dragActive = useSelector((state: RootState) => state.complaint.dragActive);
  const selectedFileName = useSelector((state: RootState) => state.complaint.selectedFileName);
  const isExtracting = useSelector((state: RootState) => state.complaint.isExtracting);
  const isSaving = useSelector((state: RootState) => state.complaint.isSaving);
  const toasts = useSelector((state: RootState) => state.complaint.toasts);
  const form = useSelector((state: RootState) => state.complaint.form);
  const complaints = useSelector((state: RootState) => state.complaint.complaints);
  
  // Chat States
  const chatMessages = useSelector((state: RootState) => state.complaint.chatMessages);
  const chatInput = useSelector((state: RootState) => state.complaint.chatInput);
  const isChatting = useSelector((state: RootState) => state.complaint.isChatting);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "info") => {
    dispatch(addToast({ message, type }));
  };

  const handleRemoveToast = (id: string) => {
    dispatch(removeToast(id));
  };

  // Fetch Complaint History
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/complaints/"
      );
      dispatch(setComplaints(res.data));
    } catch (err) {
      console.error(err);
      showToast("Unable to fetch complaint history.", "error");
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Process selected or dropped file
  const processFile = async (file: File) => {
    try {
      if (file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          dispatch(setText(event.target?.result as string));
          dispatch(setSelectedFileName(file.name));
          showToast("TXT file loaded successfully", "success");
        };
        reader.readAsText(file);
      } else if (file.name.endsWith(".pdf")) {
        dispatch(setSelectedFileName(file.name));
        showToast("Processing PDF text content...", "info");
        const pdfText = await readPDF(file);
        dispatch(setText(pdfText));
        showToast("PDF file parsed successfully", "success");
      } else {
        showToast("Only TXT and PDF files are supported.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Unable to read file.", "error");
    }
  };

  // Upload TXT / PDF
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      dispatch(setDragActive(true));
    } else if (e.type === "dragleave") {
      dispatch(setDragActive(false));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setDragActive(false));
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setSelectedFileName(""));
    dispatch(setText(""));
    dispatch(clearChat());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("File selection cleared", "info");
  };

  // AI Extraction
  const extractAI = async () => {
    if (!text.trim()) {
      showToast("Please upload or paste complaint text first.", "error");
      return;
    }

    dispatch(setIsExtracting(true));
    dispatch(clearChat());
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/ai/extract",
        {
          text,
        }
      );

      dispatch(setForm({
        customer_name: res.data.customer_name || "",
        complaint_source: res.data.complaint_source || "",
        product_name: res.data.product_name || "",
        product_strength: res.data.product_strength || "",
        batch_number: res.data.batch_number || "",
        manufacture_date: res.data.manufacture_date || "",
        expiry_date: res.data.expiry_date || "",
        quantity_affected: res.data.quantity_affected || "",
        complaint_type: res.data.complaint_type || "",
        complaint_description: res.data.complaint_description || "",
        severity: res.data.severity || "",
        priority: res.data.priority || "",
        ai_summary: res.data.ai_summary || "Generated using Groq AI",
      }));

      // Set initial chatbot assistant introduction
      dispatch(addChatMessage({
        sender: "ai",
        text: `I have parsed the document. How can I help you regarding this complaint? (e.g. you can ask about the product details or batch numbers).`
      }));

      showToast("AI Extraction Successful", "success");
    } catch (err) {
      console.error(err);
      showToast("AI Extraction Failed", "error");
    } finally {
      dispatch(setIsExtracting(false));
    }
  };

  // Chat QA system
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!text.trim()) {
      showToast("Please upload or paste a complaint context first.", "error");
      return;
    }

    const currentQuery = chatInput;
    dispatch(addChatMessage({ sender: "user", text: currentQuery }));
    dispatch(setChatInput(""));
    dispatch(setIsChatting(true));

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/ai/chat",
        {
          complaint_text: text,
          user_message: currentQuery,
          history: chatMessages
        }
      );
      dispatch(addChatMessage({ sender: "ai", text: res.data.response }));
    } catch (err) {
      console.error(err);
      showToast("Failed to get chatbot response.", "error");
      dispatch(addChatMessage({ sender: "ai", text: "Error: Unable to connect to assistant." }));
    } finally {
      dispatch(setIsChatting(false));
    }
  };

  // Save Complaint
  const saveComplaint = async () => {
    dispatch(setIsSaving(true));
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/complaints/",
        {
          customer_name: form.customer_name,
          complaint_source: form.complaint_source,
          product_name: form.product_name,
          product_strength: form.product_strength,
          batch_number: form.batch_number,
          manufacture_date: form.manufacture_date,
          expiry_date: form.expiry_date,
          quantity_affected: form.quantity_affected,
          complaint_type: form.complaint_type,
          complaint_description: form.complaint_description,
          severity: form.severity,
          priority: form.priority,
          ai_summary: form.ai_summary || "Generated using Groq AI",
        }
      );

      showToast("Complaint Saved Successfully! ID: " + res.data.id, "success");
      
      // Reset form & inputs via Redux actions
      dispatch(resetForm());
      dispatch(setSelectedFileName(""));
      dispatch(setText(""));
      dispatch(clearChat());

      fetchComplaints();
    } catch (err) {
      console.error(err);
      showToast("Failed to Save Complaint", "error");
    } finally {
      dispatch(setIsSaving(false));
    }
  };

  // Helper to choose badge class based on source
  const getSourceBadgeClass = (source: string) => {
    const src = source?.toLowerCase() || "";
    if (src === "email") return "source-badge email";
    if (src.includes("fda")) return "source-badge fda";
    return "source-badge other";
  };

  return (
    <div className="app">
      {/* Toast Notifications Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-icon">
              {t.type === "success" && <CheckCircle2 size={18} />}
              {t.type === "error" && <AlertCircle size={18} />}
              {t.type === "info" && <Info size={18} />}
            </div>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => handleRemoveToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <header className="header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <Brain size={36} color="#ffffff" />
          </div>
          <div className="header-text">
            <h1>AI Complaint Management System</h1>
            <p>Pharmaceutical Quality Management</p>
          </div>
        </div>
      </header>

      <div className="dashboard">
        {/* Main Content */}
        <div className="content">
          {/* LEFT SIDE */}
          <div className="left">
            {/* Total Complaints Quick Badge */}
            <div className="stat-card-inline">
              <div className="stat-card-inline-content">
                <div className="stat-card-icon-wrapper">
                  <Layers size={18} />
                </div>
                <span className="stat-card-label">Total Registered Complaints</span>
                <span className="stat-card-value">{complaints.length}</span>
              </div>
            </div>

            {/* Upload Card */}
            <div className="card">
              <div className="card-header-area">
                <UploadCloud className="card-icon" size={22} />
                <h2>Upload / Paste Complaint</h2>
              </div>

              {/* Custom Drag & Drop Dropzone */}
              <div
                className={`file-dropzone ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="dropzone-icon" size={32} />
                {selectedFileName ? (
                  <div className="selected-file-badge">
                    <span>{selectedFileName}</span>
                    <button onClick={clearFile} title="Clear file selection">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p>
                      Drag and drop your file here, or <span>browse files</span>
                    </p>
                    <small>Supports PDF or TXT complaint records</small>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>

              <textarea
                rows={5}
                value={text}
                placeholder="Or paste direct complaint text or email transcript here..."
                onChange={(e) => dispatch(setText(e.target.value))}
              />

              <button
                className="btn btn-pulse"
                onClick={extractAI}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="spinner" size={16} />
                    Extracting with AI...
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    Extract with AI
                  </>
                )}
              </button>
            </div>

            {/* Complaint Details */}
            <div className="card">
              <div className="card-header-area">
                <FileText className="card-icon" size={22} />
                <h2>Complaint Details</h2>
              </div>

              <div className="form-grid">
                {/* Section 1: Source and Customer */}
                <div>
                  <label className="summary-label">Complaint Source</label>
                  <input
                    value={form.complaint_source}
                    placeholder="e.g. Email, FDA Portal, Phone"
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "complaint_source", value: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="summary-label">Customer Name</label>
                  <input
                    value={form.customer_name}
                    placeholder="e.g. John Doe, CVS Pharmacy"
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "customer_name", value: e.target.value }))
                    }
                  />
                </div>

                {/* Section 2: Product Identification */}
                <div>
                  <label className="summary-label">Product Name</label>
                  <input
                    value={form.product_name}
                    placeholder="Product Name"
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "product_name", value: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="summary-label">Product Strength / Grade</label>
                  <input
                    value={form.product_strength}
                    placeholder="e.g. 500mg, USP Grade"
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "product_strength", value: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="summary-label">Batch / Lot Number</label>
                  <input
                    value={form.batch_number}
                    placeholder="Batch/Lot Number"
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "batch_number", value: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="summary-label">Quantity Affected</label>
                  <div className="input-with-suffix">
                    <input
                      value={form.quantity_affected}
                      placeholder="Amount affected"
                      onChange={(e) =>
                        dispatch(updateFormField({ field: "quantity_affected", value: e.target.value }))
                      }
                    />
                    <span className="input-suffix-badge">kg</span>
                  </div>
                </div>

                <div>
                  <label className="summary-label">Manufacture Date</label>
                  <input
                    type="date"
                    value={form.manufacture_date}
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "manufacture_date", value: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="summary-label">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "expiry_date", value: e.target.value }))
                    }
                  />
                </div>

                {/* Section 3: Complaint details */}
                <div className="form-group-full">
                  <label className="summary-label">Complaint Type</label>
                  <input
                    value={form.complaint_type}
                    placeholder="e.g. Packaging Issue, Contamination, Discoloration"
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "complaint_type", value: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group-full">
                  <label className="summary-label">Detailed Complaint Description</label>
                  <textarea
                    rows={4}
                    value={form.complaint_description}
                    placeholder="Detailed description of quality issues..."
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "complaint_description", value: e.target.value }))
                    }
                  />
                </div>

                {/* Section 4: Assess & Priority */}
                <div>
                  <label className="summary-label">Initial Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "severity", value: e.target.value }))
                    }
                  >
                    <option value="">Awaiting AI extraction...</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="summary-label">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      dispatch(updateFormField({ field: "priority", value: e.target.value }))
                    }
                  >
                    <option value="">Awaiting AI extraction...</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <button
                className="btn"
                onClick={saveComplaint}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="spinner" size={16} />
                    Saving Complaint...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Complaint
                  </>
                )}
              </button>
            </div>

            {/* Complaint History */}
            <div className="card">
              <div className="card-header-area">
                <History className="card-icon" size={22} />
                <h2>Complaint History</h2>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Source</th>
                    </tr>
                  </thead>

                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
                          No complaint records found.
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <span className="id-badge">{c.id}</span>
                          </td>
                          <td>{c.customer_name || "N/A"}</td>
                          <td>{c.product_name || "N/A"}</td>
                          <td>
                            <span className={getSourceBadgeClass(c.complaint_source)}>
                              {c.complaint_source || "Other"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="right">
            <div className="card">
              <div className="card-header-area">
                <Brain className="card-icon" size={22} />
                <h2>AI Assistant</h2>
              </div>

              <div className="ai-assistant-wrapper">
                <div className="ai-assistant-header">
                  <h3>AI Complaint Intake Assistant</h3>
                  <div className={`pulse-indicator ${isExtracting || isChatting ? "loading" : ""}`} title={isExtracting ? "AI is processing..." : "AI Assistant Ready"} />
                </div>

                <div className="chatbox">
                  {/* AI Extracted Summaries Grid */}
                  <div className="summary-item">
                    <span className="summary-label">Executive AI Summary</span>
                    <span className={`summary-value ${!form.ai_summary ? "empty" : ""}`}>
                      {form.ai_summary || "No document loaded yet."}
                    </span>
                  </div>

                  <div className="divider" />

                  {/* Interactive QA Chatbot Messages Feed */}
                  <span className="complaint-text-label">Interactive AI Chatbot</span>
                  <div className="chat-history-container">
                    {chatMessages.length === 0 ? (
                      <div className="chat-message ai">
                        Upload or paste a complaint record, click "Extract with AI", and I will help answer any questions or check completeness for you.
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.sender}`}>
                          {msg.text}
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* QA Chat Input box */}
                  <form className="chat-input-wrapper" onSubmit={sendChatMessage}>
                    <input
                      value={chatInput}
                      placeholder="Ask me anything about this complaint..."
                      onChange={(e) => dispatch(setChatInput(e.target.value))}
                      disabled={isChatting || isExtracting}
                    />
                    <button className="btn" type="submit" disabled={isChatting || isExtracting || !chatInput.trim()}>
                      {isChatting ? (
                        <Loader2 className="spinner" size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;