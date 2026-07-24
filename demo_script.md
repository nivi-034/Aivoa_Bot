# 🎥 Presentation Script: AI-Powered QMS Customer Complaint Management System

This document contains the complete visual actions and detailed spoken script for recording a **10–15 minute demo video** of your project submission, fully aligned with the **AIVOA Full Stack Assessment** requirements.

---

## 🧭 Visual Timeline and Content Outline
1. **0:00 - 2:00 | Introduction & Pharmaceutical QMS Context** (FDF/API Quality Assurance background).
2. **2:00 - 4:30 | Frontend Demonstration & Workflow** (File uploader dropzone, PDF parser, custom form elements, inline stats card).
3. **4:30 - 7:30 | Technical Architecture: Redux State & FastAPI Backend** (Redux store, actions, routes).
4. **7:30 - 10:30 | AI Agent Architecture: LangGraph & Groq LLMs** (StateGraph compilation, `gemma2-9b-it` fallback logic, chat QA agent).
5. **10:30 - 12:30 | End-to-End Live Walkthrough** (Live file extraction, chatbot conversation, database save, history update).
6. **12:30 - 13:30 | Key Design Decisions & Conclusion**.

---

## 🎬 Section 1: Introduction & Pharmaceutical QMS Context (2 mins)
*(**Visual**: Capture the browser displaying the main application dashboard at `http://localhost:5173/`. Point with the mouse to the clean grid design, header, and Total Complaints banner).*

**🎙️ Spoken Script:**
> "Hello everyone, and welcome to this technical demonstration of our AI-Powered Customer Complaint Management System—built specifically for quality assurance modules in pharmaceutical manufacturing.
>
> In the pharmaceutical industry, managing customer complaints is not just a customer service task; it is a critical regulatory requirement governed by agencies like the FDA. Manufacturers of both **API** (Active Pharmaceutical Ingredients) and **FDF** (Finished Dosage Forms) must log, investigate, prioritize, and find the root cause of every quality complaint to prevent product recalls and ensure patient safety.
>
> Traditionally, this intake process is a major bottleneck. Complaints arrive via email transcripts, scanned scan reports, or letters. Quality control operators must read these unstructured documents, identify critical fields like batch numbers or strengths, and log them into databases manually. This manual entry is slow and highly prone to transposition errors.
>
> Our system automates this entire intake flow. On the screen, you see our modern dashboard styled with the **Google Inter** font family, utilizing a professional **white-and-dark blue** theme.
>
> Let's look at the interface structure:
> - **Header**: Prominently displays our brand banner, setting a clinical and clean tone.
> - **Total Registered Complaints Inline Banner**: Displays the live number of logged complaints inside the left column, perfectly aligned with our workspace.
> - **Left Column**: Contains the **Upload / Paste Complaint** dropzone and the structured **Complaint Details** log form.
> - **Right Column**: Houses our sticky **AI Assistant** panel which contains our state-controlled AI summary and interactive chatbot QA feed.
> - **Bottom**: Displays the **Complaint History** log table showing records fetched from our database."

---

## 📂 Section 2: Frontend Demonstration & Workflow (2.5 mins)
*(**Visual**: Hover over the file uploader dropzone. Point out the dashed borders, upload icon, and text area. Open a folder on your screen and drag and drop a sample complaint PDF into the dropzone).*

**🎙️ Spoken Script:**
> "Let's demonstrate our frontend intake workflow. The interface supports two core methods for document ingestion:
> 
> First, we have a custom, dashed **Drag-and-Drop file uploader**. Here, quality control operators can drop text logs or multi-page PDF documents. When a file is dropped, our frontend PDF parser utility reads and extracts text streams directly from the PDF in the browser—meaning no heavyweight OCR or document parsing libraries are required on the server side.
> 
> Once a file is selected, the dropzone dynamically updates with a badge showing the filename and a clear button to reset the selection. In addition, an elegant green success Toast notification slides in from the top right to provide instant user feedback.
> 
> If the user is copying text directly from an email client or phone log, they can paste it directly into this text area.
> 
> Next, let's explore our **Complaint Details** form. It is fully structured to capture all parameters needed for compliance:
> - Under **Origin Details**, we have the Source and Customer Name.
> - Under **Product & Batch Identification**, we capture the Product Name, Product Strength, Batch Number, and **Quantity Affected**, which features a styled unit suffix badge showing `'kg'`.
> - We also have HTML5 date pickers for **Manufacture Date** and **Expiry Date**.
> - Under **Complaint Details**, we record the Complaint Type and description.
> - Finally, under **Initial Assessment & Priority**, we have select dropdown menus for **Initial Severity** and **Priority**, matching standard QMS triage requirements.
> 
> Let's trigger the AI engine by clicking **Extract with AI**."

---

## ⚙️ Section 3: Technical Architecture: Redux State & FastAPI Backend (3 mins)
*(**Visual**: Open VS Code. Show the file `store.ts`, then open `complaintSlice.ts`, highlighting how state and reducers are configured. Next, open `main.tsx` showing the provider, then open FastAPI `main.py` and router `complaint.py`).*

**🎙️ Spoken Script:**
> "Before we run the extraction, let's explain the underlying code architecture.
>
> On the frontend, state management is governed entirely by **Redux Toolkit** and **React Redux**, satisfying our mandatory technology stack. 
> 
> Here in [store.ts](file:///e:/aivoa.ai/frontend/src/store/store.ts), we initialize a single, centralized store. 
> 
> In [complaintSlice.ts](file:///e:/aivoa.ai/frontend/src/store/complaintSlice.ts), we declare our state slices. Redux tracks everything: the text input, loading flags like `isExtracting` and `isSaving`, the active toast alerts queue, and the 12 fields of our QMS complaint form. 
> 
> Whenever an input changes, or the AI extracts data, a Redux action is dispatched (e.g. `updateFormField` or `setForm`), updating the store and triggering a reactive, high-performance rerender of the UI.
> 
> Now, looking at the **Backend**:
> Our backend is written in Python using **FastAPI**, running locally via a Uvicorn ASGI server.
> 
> In [database.py](file:///e:/aivoa.ai/backend/app/db/database.py), we set up our SQLAlchemy ORM engine. The database is configured to connect to a local **PostgreSQL** database as specified in our `.env` configuration file.
> 
> In [complaint.py](file:///e:/aivoa.ai/backend/app/routers/complaint.py), we expose our REST endpoints. A `GET` call queries database records to render our history log, while a `POST` call validates incoming payloads against Pydantic verification schemas and writes new complaints to our Postgres tables."

---

## 🤖 Section 4: AI Agent Architecture: LangGraph & Groq LLMs (3 mins)
*(**Visual**: Open `groq_service.py` in VS Code. Point out the `AgentState` TypedDict, the `extract_node` and `chat_node` functions, and the compiled `StateGraph` definitions).*

**🎙️ Spoken Script:**
> "Let's focus on the heart of our AI system: our **AI Agent pipeline**.
> 
> The assessment requires using **LangGraph** as our AI Agent Framework. We have implemented two distinct stateful graphs inside [groq_service.py](file:///e:/aivoa.ai/backend/app/services/groq_service.py):
> 
> 1. **Details Extraction Graph**:
>    - We define `AgentState` as a typed dictionary tracking the raw text and extracted data.
>    - We declare `extract_node`, which passes the text context to a structured JSON prompt instructing the LLM to extract the customer name, batch number, manufacture date, severity, and other properties.
>    - We construct the graph using `StateGraph(AgentState)`, add our extractor node, draw edges from `START -> extractor -> END`, and compile the graph.
> 
> 2. **Conversational QA Chatbot Graph**:
>    - We define `ChatState` tracking the active complaint text context, current user question, message history, and response.
>    - We declare a `chat_node` executing QA prompts, allowing operators to run queries against the document. We draw edges from `START -> chatbot -> END` and compile it.
> 
> Now let's talk about the LLMs. The specification requires Groq, specifically prioritizing the **`gemma2-9b-it`** model. However, Groq has recently decommissioned `gemma2-9b-it`. 
> 
> To ensure production reliability, we implemented a resilient fallback mechanism. Inside our graph nodes, the code attempts to call `gemma2-9b-it` first. If it encounters a decommission exception (error code 400), it automatically logs the error and falls back to **`llama-3.3-70b-versatile`** in a try-except block, successfully returning the structured details to our FastAPI endpoint without failing the client request."

---

## 💻 Section 5: End-to-End Live Walkthrough (2 mins)
*(**Visual**: Switch back to the browser window. Click **Extract with AI**. Point to the button loader and the amber pulse indicator. Once filled, type 'Are there any packaging defects?' in the chat box, click Send, verify response, and then click **Save Complaint**).*

**🎙️ Spoken Script:**
> "Let's witness the complete end-to-end flow in action.
> 
> I click **Extract with AI**. The button spinner begins rotating and our AI Assistant indicator shows an amber breathing pulse, indicating LangGraph execution is underway.
> 
> And there it is! The system returns the structured JSON, and Redux dispatches actions to populate our form. Notice how the date pickers are automatically configured, the 'kg' quantity is populated, and Severity and Priority dropdown options have been Triaged.
> 
> Now, let's test our **Interactive QA Chatbot**.
> In the chat input, I'll ask: *'What is the batch number?'*
> 
> When I click Send, the request hits our FastAPI `/ai/chat` endpoint. The chatbot agent reads the text and context, returning: *'The batch number is 987654.'*
> 
> Next, I'll ask: *'Are there any packaging issues?'*
> 
> The bot analyzes the text and replies: *'Yes, the customer reported that the packaging was damaged.'*
> 
> Finally, I review the form and click **Save Complaint**.
> 
> The database request completes. The form inputs reset to initial values, the chat resets, a success toast pops up with the database ID, and our **Complaint History** log at the bottom instantly updates to render our new entry, complete with its color-coded Source tag.
> 
> All of this happens dynamically with zero page reloads, showing a responsive user flow."

---

## 🏁 Section 6: Key Design Decisions & Conclusion (1 min)
*(**Visual**: Show the full-page view of the application dashboard. Let the scroll bar slide down to the history log, then back to the header).*

**🎙️ Spoken Script:**
> "To conclude, let's summarize the key design decisions of this project:
> 1. **Layout Integrity**: Repositioned the Total Complaints count as an inline stat banner inside the left column, solving column alignment and ensuring a proportional, clean grid structure.
> 2. **Resilient AI Pipelines**: Used LangGraph stateful graphs coupled with model fallbacks to maintain system stability even when API endpoints decommission models.
> 3. **Premium Visuals**: Replaced raw emojis with clean SVG Lucide icons, styled forms with rounded borders, focus glows, and transition states.
> 
> This creates a secure, highly functional, and regulatory-ready intake system for pharmaceutical quality management.
> 
> Thank you for your time, and I look forward to your feedback!"
