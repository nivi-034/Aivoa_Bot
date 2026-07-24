import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export interface ComplaintForm {
  customer_name: string;
  complaint_source: string;
  product_name: string;
  product_strength: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  quantity_affected: string;
  complaint_type: string;
  complaint_description: string;
  severity: string;
  priority: string;
  ai_summary: string;
}

export interface ComplaintState {
  text: string;
  dragActive: boolean;
  selectedFileName: string;
  isExtracting: boolean;
  isSaving: boolean;
  toasts: Toast[];
  form: ComplaintForm;
  complaints: any[];
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatting: boolean;
}

const initialState: ComplaintState = {
  text: "",
  dragActive: false,
  selectedFileName: "",
  isExtracting: false,
  isSaving: false,
  toasts: [],
  form: {
    customer_name: "",
    complaint_source: "",
    product_name: "",
    product_strength: "",
    batch_number: "",
    manufacture_date: "",
    expiry_date: "",
    quantity_affected: "",
    complaint_type: "",
    complaint_description: "",
    severity: "",
    priority: "",
    ai_summary: "",
  },
  complaints: [],
  chatMessages: [],
  chatInput: "",
  isChatting: false,
};

const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    setText(state, action: PayloadAction<string>) {
      state.text = action.payload;
    },
    setDragActive(state, action: PayloadAction<boolean>) {
      state.dragActive = action.payload;
    },
    setSelectedFileName(state, action: PayloadAction<string>) {
      state.selectedFileName = action.payload;
    },
    setIsExtracting(state, action: PayloadAction<boolean>) {
      state.isExtracting = action.payload;
    },
    setIsSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },
    addToast(state, action: PayloadAction<{ message: string; type: "success" | "error" | "info" }>) {
      const id = Math.random().toString(36).substring(2, 9);
      state.toasts.push({
        id,
        message: action.payload.message,
        type: action.payload.type,
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setForm(state, action: PayloadAction<ComplaintForm>) {
      state.form = action.payload;
    },
    updateFormField(state, action: PayloadAction<{ field: keyof ComplaintForm; value: string }>) {
      state.form[action.payload.field] = action.payload.value;
    },
    resetForm(state) {
      state.form = initialState.form;
    },
    setComplaints(state, action: PayloadAction<any[]>) {
      state.complaints = action.payload;
    },
    setChatInput(state, action: PayloadAction<string>) {
      state.chatInput = action.payload;
    },
    addChatMessage(state, action: PayloadAction<ChatMessage>) {
      state.chatMessages.push(action.payload);
    },
    clearChat(state) {
      state.chatMessages = [];
      state.chatInput = "";
    },
    setIsChatting(state, action: PayloadAction<boolean>) {
      state.isChatting = action.payload;
    },
  },
});

export const {
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
  setIsChatting,
} = complaintSlice.actions;

export default complaintSlice.reducer;
