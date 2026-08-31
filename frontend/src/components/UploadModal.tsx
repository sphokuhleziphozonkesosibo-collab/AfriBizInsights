import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Table } from 'lucide-react';
import { uploadSalesFile, type IngestionResult } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
      setResult(null);

      // Generate Live Preview for CSV
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            const lines = text.split('\n').filter((l) => l.trim().length > 0);
            if (lines.length > 0) {
              const head = lines[0].split(',').map((h) => h.trim());
              setHeaders(head);
              const rows = lines.slice(1, 5).map((l) => l.split(',').map((c) => c.trim()));
              setPreviewRows(rows);
            }
          }
        };
        reader.readAsText(file);
      } else {
        setHeaders(['Excel File Selected']);
        setPreviewRows([[file.name, `${(file.size / 1024).toFixed(1)} KB`]]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a CSV or Excel file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await uploadSalesFile(selectedFile);
      setResult(res);
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      const serverError =
        err.response?.data?.message ||
        err.response?.data?.validationErrors?.join(', ') ||
        err.message ||
        'Failed to upload sales file. Ensure Visual Studio API is running.';
      setErrorMsg(serverError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setHeaders([]);
    setResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-100 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Smart Ingestion Wizard</h3>
            <p className="text-xs text-slate-500">Live preview & column verification before ingestion</p>
          </div>
        </div>

        {/* File Dropzone */}
        <div className="mt-4">
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20">
            <FileText className="h-7 w-7 text-indigo-500 mb-1.5" />
            <span className="text-xs font-semibold text-slate-700">
              {selectedFile ? selectedFile.name : 'Click to select or drag & drop file'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">Supports CSV, XLSX up to 10MB</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Live Preview Table */}
        {previewRows.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
              <Table className="h-4 w-4 text-indigo-600" />
              <span>File Data Preview (First 4 Rows)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    {headers.map((h, i) => (
                      <th key={i} className="pb-1.5 pr-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {previewRows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="py-1.5 pr-3 font-mono truncate max-w-[150px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success result */}
        {result && result.success && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Import Completed Successfully!</span>
            </div>
            <p className="text-emerald-700">
              Processed <strong>{result.totalRowsProcessed} rows</strong> • Inserted <strong>{result.successfulSalesInserted} sales</strong> • Value: <strong>R {result.totalRevenueImported.toLocaleString()}</strong>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing File...</span>
              </>
            ) : (
              <span>Confirm & Ingest</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;