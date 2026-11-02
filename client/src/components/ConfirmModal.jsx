import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-rose-800 font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-100 disabled:opacity-50 transition"
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
