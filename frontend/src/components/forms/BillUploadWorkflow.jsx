import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../../hooks/useToast';
import { formatNumber, formatCarbon } from '../../utils/formatters';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Building2,
  Zap,
} from 'lucide-react';

export const BillUploadWorkflow = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Edit, 3: Processing, 4: Result
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const toast = useToast();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select an electricity bill file to upload');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/bill/extract`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExtractedData(response.data.extracted_data);
      setWarnings(response.data.warnings || []);
      setStep(2);
      toast.success('Bill data extracted successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to extract bill data. Please check file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData.units_consumed_kwh || extractedData.units_consumed_kwh <= 0) {
      toast.error('Please enter valid electricity units consumed (kWh)');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/bill/confirm`,
        extractedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResultData(response.data);
      setStep(4);
      toast.success('Bill saved and carbon footprint calculated!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to process and confirm bill calculation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        {[
          { num: 1, label: 'Upload Document' },
          { num: 2, label: 'Verify Fields' },
          { num: 3, label: 'Carbon Agent' },
          { num: 4, label: 'Impact & Forecast' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                step === s.num
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : step > s.num
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${step === s.num ? 'text-slate-100' : 'text-slate-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: FILE UPLOAD */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
            <UploadCloud className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h4 className="text-sm font-bold text-slate-100">Upload Electricity Bill Document</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Select or drop your PDF utility bill, image invoice (PNG/JPG), Excel workbook (XLSX), or CSV record.
            </p>

            <label className="inline-block mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors border border-slate-700">
              Browse Document
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={!file || loading}
              onClick={handleExtract}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Extracting Entities...
                </>
              ) : (
                <>
                  Next: Extract Bill Data
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EXTRACTED DATA PREVIEW & VALIDATION */}
      {step === 2 && extractedData && (
        <div className="space-y-4">
          {/* Validation warnings */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Validation Alerts ({warnings.length}):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billing Period
              </label>
              <input
                type="text"
                value={extractedData.billing_period || ''}
                onChange={(e) => setExtractedData({ ...extractedData, billing_period: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Campus Wing / Building
              </label>
              <select
                value={extractedData.wing || 'A Wing'}
                onChange={(e) => setExtractedData({ ...extractedData, wing: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="A Wing">A Wing (350 KVA Contract Demand)</option>
                <option value="B Wing">B Wing (175 KVA Contract Demand)</option>
                <option value="Construction">Construction / Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Electricity Consumed (kWh) *
              </label>
              <input
                type="number"
                step="0.1"
                value={extractedData.units_consumed_kwh || ''}
                onChange={(e) => setExtractedData({ ...extractedData, units_consumed_kwh: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={extractedData.amount_paid || ''}
                onChange={(e) => setExtractedData({ ...extractedData, amount_paid: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billing Demand (KVA)
              </label>
              <input
                type="number"
                step="0.1"
                value={extractedData.billing_demand_kva || ''}
                onChange={(e) => setExtractedData({ ...extractedData, billing_demand_kva: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Power Factor (PF)
              </label>
              <input
                type="number"
                step="0.01"
                max="1.0"
                value={extractedData.power_factor || ''}
                onChange={(e) => setExtractedData({ ...extractedData, power_factor: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Back to Upload
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Calculating Carbon...
                </>
              ) : (
                <>
                  Confirm & Calculate Carbon Footprint
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS IMPACT & UPDATED FORECAST */}
      {step === 4 && resultData && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-base font-extrabold text-slate-100">
              Electricity Bill Processed & Carbon Stored
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Deterministic Scope 2 calculation completed via Carbon Calculator Agent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold font-mono">Calculated Scope 2 Carbon</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                {formatCarbon(resultData.bill_analysis?.calculated_carbon_kgco2e)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Factor: 0.82 kgCO₂e/kWh</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold font-mono">vs Previous Month</div>
              <div className="text-xl font-extrabold text-slate-100 font-mono mt-1 flex items-center gap-1">
                {resultData.bill_analysis?.comparison_prev_month_pct !== null && resultData.bill_analysis?.comparison_prev_month_pct !== undefined ? (
                  <>
                    {resultData.bill_analysis.comparison_prev_month_pct >= 0 ? (
                      <span className="text-rose-400 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{resultData.bill_analysis.comparison_prev_month_pct}%
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {resultData.bill_analysis.comparison_prev_month_pct}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">First Entry</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Month-over-Month</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold font-mono">vs Same Month Last Year</div>
              <div className="text-xl font-extrabold text-slate-100 font-mono mt-1 flex items-center gap-1">
                {resultData.bill_analysis?.comparison_prev_year_pct !== null && resultData.bill_analysis?.comparison_prev_year_pct !== undefined ? (
                  <>
                    {resultData.bill_analysis.comparison_prev_year_pct >= 0 ? (
                      <span className="text-rose-400 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{resultData.bill_analysis.comparison_prev_year_pct}%
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {resultData.bill_analysis.comparison_prev_year_pct}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">Baseline Year</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Year-over-Year</div>
            </div>
          </div>

          {/* Refreshed 6-Month Forecast preview */}
          {resultData.updated_forecast?.forecast_summary && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>6-Month ML Forecaster Refreshed Automatically</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Next 6 months predicted electricity:{' '}
                <strong className="text-slate-100 font-mono">
                  {formatNumber(resultData.updated_forecast.forecast_summary.total_predicted_energy_kwh)} kWh
                </strong>{' '}
                ({formatCarbon(resultData.updated_forecast.forecast_summary.total_predicted_co2e_kg)} Scope 2 CO₂e).
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setFile(null);
                setExtractedData(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Upload Another Bill
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Close & Return
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
