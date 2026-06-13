'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  Sliders, 
  Info,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Cpu,
  Lock,
  ArrowRightLeft,
  ListFilter,
  Check,
  X,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

interface FeatureImpact {
  name: string;
  value: number;
  scaled_value: number;
  importance: number;
  impact: number;
}

interface PredictionResult {
  prediction: number;
  probability: number;
  is_fraud: boolean;
  top_features: FeatureImpact[];
}

interface AlertLogItem {
  id: string;
  time: string;
  card: string;
  amount: number;
  risk: number;
  status: 'SAFE' | 'BLOCKED' | 'REVIEW';
  actionTaken: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'alerts'>('simulator');
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction state
  const [transaction, setTransaction] = useState<Record<string, number>>({});
  // Prediction result state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  
  // Operational states for logs
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>([]);
  const [totalProtectedAmount, setTotalProtectedAmount] = useState<number>(14250.80);
  const [totalProcessed, setTotalProcessed] = useState<number>(248);
  const [fraudPreventedCount, setFraudPreventedCount] = useState<number>(18);

  const defaultTx: Record<string, number> = {
    Time: 45000,
    Amount: 125.50,
    V1: -0.5, V2: 0.2, V3: 1.1, V4: -0.3, V5: 0.1, V6: 0.8, V7: -0.2, V8: 0.05, V9: 0.4, V10: -0.1,
    V11: -0.6, V12: 0.7, V13: -0.2, V14: 0.9, V15: 0.1, V16: -0.4, V17: 0.8, V18: -0.2, V19: 0.3, V20: -0.05,
    V21: -0.1, V22: 0.2, V23: -0.15, V24: 0.4, V25: 0.2, V26: -0.1, V27: 0.05, V28: 0.02
  };

  useEffect(() => {
    setTransaction(defaultTx);
    
    // Seed initial realistic alerts log
    setAlertLogs([
      {
        id: 'TX-9824',
        time: 'Hace 3 min',
        card: '•••• •••• •••• 4920',
        amount: 850.00,
        risk: 0.9845,
        status: 'BLOCKED',
        actionTaken: 'Tarjeta bloqueada temporalmente'
      },
      {
        id: 'TX-9821',
        time: 'Hace 8 min',
        card: '•••• •••• •••• 8831',
        amount: 45.90,
        risk: 0.0012,
        status: 'SAFE',
        actionTaken: 'Aprobada automáticamente'
      },
      {
        id: 'TX-9818',
        time: 'Hace 15 min',
        card: '•••• •••• •••• 1024',
        amount: 320.00,
        risk: 0.4520,
        status: 'REVIEW',
        actionTaken: 'Pendiente de verificación SMS'
      },
      {
        id: 'TX-9815',
        time: 'Hace 22 min',
        card: '•••• •••• •••• 5592',
        amount: 1200.00,
        risk: 0.8991,
        status: 'BLOCKED',
        actionTaken: 'Tarjeta bloqueada temporalmente'
      }
    ]);
  }, []);

  const simulateTransaction = async (type: 'normal' | 'fraud') => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    const classType = type === 'normal' ? 0 : 1;
    try {
      const res = await fetch(`${API_URL}/simulate?class_type=${classType}`);
      if (!res.ok) throw new Error('No se pudo obtener una transacción simulada.');
      const data = await res.json();
      
      const txData: Record<string, number> = {};
      Object.keys(defaultTx).forEach(key => {
        txData[key] = typeof data[key] === 'number' ? data[key] : 0;
      });
      
      setTransaction(txData);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el backend.');
    } finally {
      setLoading(false);
    }
  };

  const evaluateTransaction = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      if (!res.ok) throw new Error('Error en el servicio de predicción.');
      const data: PredictionResult = await res.json();
      setPrediction(data);
      
      // Add the evaluated transaction to the Alert Log dynamically
      const newAlertId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      let status: 'SAFE' | 'BLOCKED' | 'REVIEW' = 'SAFE';
      let action = 'Aprobada automáticamente';
      
      if (data.is_fraud) {
        status = 'BLOCKED';
        action = 'Tarjeta bloqueada automáticamente';
        // Increase metrics
        setTotalProtectedAmount(prev => prev + transaction.Amount);
        setFraudPreventedCount(prev => prev + 1);
      } else if (data.probability > 0.15) {
        status = 'REVIEW';
        action = 'Marcada para revisión manual';
      }
      
      const newLogItem: AlertLogItem = {
        id: newAlertId,
        time: `Hoy, ${timeStr}`,
        card: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
        amount: transaction.Amount,
        risk: data.probability,
        status: status,
        actionTaken: action
      };
      
      setAlertLogs(prev => [newLogItem, ...prev]);
      setTotalProcessed(prev => prev + 1);
      
    } catch (err: any) {
      setError(err.message || 'Error al evaluar la transacción.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleInputChange = (field: string, val: number) => {
    setTransaction(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleResolveAlert = (id: string, action: string) => {
    setAlertLogs(prev => prev.map(log => {
      if (log.id === id) {
        return {
          ...log,
          actionTaken: action,
          status: action.includes('Aprobada') || action.includes('Liberar') ? 'SAFE' : 'BLOCKED'
        };
      }
      return log;
    }));
  };

  const featureKeys = Object.keys(defaultTx).filter(k => k.startsWith('V'));

  return (
    <div className="min-h-screen bg-[#16161A] text-[#F0EFFF] flex flex-col font-sans selection:bg-[#7F77DD] selection:text-[#16161A]">
      
      {/* Background tech grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7F77DD]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[#7F77DD]/10 bg-[#16161A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-3 bg-[#2C2C2A] border border-[#7F77DD]/20 rounded-2xl text-[#7F77DD] shadow-[0_0_20px_rgba(127,119,221,0.1)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#16161A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#7F77DD]/15 text-[#AFA9EC] font-bold px-2 py-0.5 rounded border border-[#7F77DD]/30 uppercase tracking-widest font-mono">SecOps Console</span>
              </div>
              <h1 className="text-xl font-black tracking-wider text-[#F0EFFF] uppercase">Sentinel AI</h1>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex bg-[#2C2C2A] p-1.5 rounded-2xl border border-[#7F77DD]/10">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'simulator'
                  ? 'bg-[#7F77DD] text-[#16161A] shadow-lg shadow-[#7F77DD]/20'
                  : 'text-[#F0EFFF]/60 hover:text-[#F0EFFF] hover:bg-[#16161A]/40'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Simulador
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'alerts'
                  ? 'bg-[#7F77DD] text-[#16161A] shadow-lg shadow-[#7F77DD]/20'
                  : 'text-[#F0EFFF]/60 hover:text-[#F0EFFF] hover:bg-[#16161A]/40'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Centro de Alertas ({alertLogs.filter(l => l.status !== 'SAFE').length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative">
        
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 flex items-start gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-sm">Fallo de Comunicación de API</h5>
              <p className="text-xs opacity-90">{error}</p>
              <p className="text-[10px] text-red-400/80 mt-1">Asegúrate de que el backend de FastAPI esté corriendo en <code>http://127.0.0.1:8000</code>.</p>
            </div>
          </div>
        )}

        {activeTab === 'simulator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Virtual Card & Quick Actions */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Premium Credit Card Mockup */}
              <div className="relative h-60 w-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl p-6 flex flex-col justify-between transition-all duration-500 bg-gradient-to-br from-[#2C2C2A] to-[#1e1e1d] hover:shadow-[#7F77DD]/5 hover:border-[#7F77DD]/20">
                {prediction ? (
                  prediction.is_fraud ? (
                    <div className="absolute inset-0 bg-red-600/10 blur-xl opacity-60 pointer-events-none transition-all duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-emerald-600/10 blur-xl opacity-60 pointer-events-none transition-all duration-500" />
                  )
                ) : (
                  <div className="absolute inset-0 bg-[#7F77DD]/5 blur-xl opacity-60 pointer-events-none" />
                )}

                {/* Card Header */}
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-[#AFA9EC]/70 font-mono">Tarjeta Virtual Simulada</span>
                    <span className="text-sm font-black tracking-wider text-[#F0EFFF] mt-0.5">SENTINEL CHIP</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <Fingerprint className="w-6 h-6 text-[#AFA9EC]/40" />
                    {prediction ? (
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold mt-2 ${
                        prediction.is_fraud ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {prediction.is_fraud ? 'ALERT_FRAUD' : 'PASS_SAFE'}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-white/5 text-[#F0EFFF]/60 px-2 py-0.5 rounded border border-white/10 font-mono mt-2">STANDBY</span>
                    )}
                  </div>
                </div>

                {/* Card Chip & Network */}
                <div className="flex justify-between items-center z-10">
                  <div className="w-10 h-8 bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg relative overflow-hidden flex items-center justify-center border border-amber-100/20">
                    <div className="absolute w-full h-0.5 bg-amber-950/20 top-1/2" />
                    <div className="absolute h-full w-0.5 bg-amber-950/20 left-1/2" />
                    <Cpu className="w-5 h-5 text-amber-950/60 z-10" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#AFA9EC]/60 font-mono">TIME INDEX</span>
                    <p className="text-sm font-mono font-bold text-[#F0EFFF]">{transaction.Time ?? 0}s</p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end z-10">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-[#AFA9EC]/40 font-mono">Titular Simulador</span>
                    <p className="text-xs font-mono font-bold tracking-wider text-[#F0EFFF]">SECURE CLIENT</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-widest text-[#AFA9EC]/40 font-mono">Monto de Transacción</span>
                    <p className="text-2xl font-mono font-black text-[#F0EFFF]">${(transaction.Amount ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Simulation triggers */}
              <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#AFA9EC]">Simulador de Inyección</h3>
                  <p className="text-xs text-[#F0EFFF]/60">Prueba el modelo cargando transacciones reales etiquetadas</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => simulateTransaction('normal')}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#16161A]/60 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:bg-[#16161A]/80 transition-all gap-2 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Normal</span>
                  </button>
                  <button
                    onClick={() => simulateTransaction('fraud')}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#16161A]/60 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-[#16161A]/80 transition-all gap-2 disabled:opacity-50"
                  >
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Fraude</span>
                  </button>
                </div>
              </div>

              {/* Real-time Result Panel */}
              <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl flex flex-col min-h-60 relative overflow-hidden justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#AFA9EC] mb-1">Diagnóstico SecOps</h3>
                  <p className="text-xs text-[#F0EFFF]/60">Resultado de la evaluación del modelo</p>
                </div>

                {!prediction ? (
                  <div className="my-auto py-8 text-center flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-[#16161A] border border-[#7F77DD]/10 rounded-2xl text-[#7F77DD]/50">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-[#F0EFFF]/50 max-w-xs">Esperando evaluación. Modifica las variables a la derecha y haz clic en "Analizar Transacción".</p>
                  </div>
                ) : (
                  <div className="space-y-6 my-auto pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-4 rounded-2xl border ${
                        prediction.is_fraud 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {prediction.is_fraud ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-widest text-[#AFA9EC]/70">Score final</span>
                        <h4 className={`text-xl font-black ${prediction.is_fraud ? 'text-red-400' : 'text-emerald-400'}`}>
                          {prediction.is_fraud ? 'ALERTA: FRAUDE' : 'TRANSACCIÓN SEGURA'}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#AFA9EC]/70">Score de Riesgo</span>
                        <span className={`font-bold ${prediction.is_fraud ? 'text-red-400' : 'text-emerald-400'}`}>
                          {(prediction.probability * 100).toFixed(6)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#16161A] h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${prediction.is_fraud ? 'bg-red-500 shadow-md shadow-red-500/30' : 'bg-emerald-500 shadow-md shadow-emerald-500/30'}`}
                          style={{ width: `${prediction.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Variables inputs & sliders */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-black tracking-wide uppercase">Consola de Control</h2>
                    <p className="text-xs text-[#F0EFFF]/60">Configura los parámetros para evaluar la transacción</p>
                  </div>
                </div>

                {loading ? (
                  <div className="h-96 flex flex-col justify-center items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-[#7F77DD] animate-spin" />
                    <p className="text-xs text-[#AFA9EC]">Estableciendo variables...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Primary Variables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#16161A]/50 p-4 rounded-2xl border border-[#7F77DD]/5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#AFA9EC] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Time (Segundos transcurridos)
                        </label>
                        <input
                          type="number"
                          value={transaction.Time ?? 0}
                          onChange={(e) => handleInputChange('Time', parseFloat(e.target.value))}
                          className="w-full bg-[#2C2C2A] border border-[#7F77DD]/20 rounded-xl px-4 py-2.5 text-xs font-mono text-[#F0EFFF] focus:outline-none focus:border-[#7F77DD]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#AFA9EC] flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Monto ($USD)
                        </label>
                        <input
                          type="number"
                          value={transaction.Amount ?? 0}
                          onChange={(e) => handleInputChange('Amount', parseFloat(e.target.value))}
                          className="w-full bg-[#2C2C2A] border border-[#7F77DD]/20 rounded-xl px-4 py-2.5 text-xs font-mono text-[#F0EFFF] focus:outline-none focus:border-[#7F77DD]"
                        />
                      </div>
                    </div>

                    {/* Expandable Advanced Variables */}
                    <div>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full py-3 bg-[#16161A]/60 border border-[#7F77DD]/10 hover:border-[#7F77DD]/30 rounded-2xl flex items-center justify-between px-4 transition-all"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-[#AFA9EC] flex items-center gap-2">
                          <Cpu className="w-4 h-4" />
                          Variables del Sistema (V1 - V28 PCA)
                        </span>
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-[#16161A]/30 p-4 rounded-2xl border border-white/5 max-h-96 overflow-y-auto">
                          {featureKeys.map(key => {
                            const val = transaction[key] ?? 0;
                            return (
                              <div key={key} className="space-y-1.5 bg-[#2C2C2A]/50 p-3 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-[#AFA9EC] font-bold">{key}</span>
                                  <span className="text-[#F0EFFF]/80">{val.toFixed(4)}</span>
                                </div>
                                <input
                                  type="range"
                                  min="-3"
                                  max="3"
                                  step="0.01"
                                  value={val}
                                  onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                                  className="w-full accent-[#7F77DD] h-1 bg-[#16161A] rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Trigger prediction */}
                    <button
                      onClick={evaluateTransaction}
                      disabled={evaluating}
                      className="w-full py-4 bg-[#7F77DD] text-[#16161A] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#AFA9EC] transition-all duration-300 flex justify-center items-center gap-2 shadow-xl shadow-[#7F77DD]/20 disabled:opacity-50"
                    >
                      {evaluating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Analizando Transacción...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-4 h-4" />
                          Evaluar Transacción
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Explainability impact horizontal chart */}
              {prediction && (
                <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#AFA9EC]">Explicabilidad Local (SHAP Risk Factors)</h3>
                    <p className="text-xs text-[#F0EFFF]/60">Cómo influye cada variable en la clasificación de esta transacción específica</p>
                  </div>

                  <div className="space-y-3">
                    {prediction.top_features.slice(0, 5).map((feat) => {
                      const isPositive = feat.impact > 0;
                      const absImpacts = prediction.top_features.map(f => Math.abs(f.impact));
                      const maxAbs = Math.max(...absImpacts, 0.001);
                      const widthPercentage = (Math.abs(feat.impact) / maxAbs) * 100;
                      
                      return (
                        <div key={feat.name} className="flex items-center text-xs gap-3">
                          <span className="font-mono text-[#F0EFFF] w-12 shrink-0 font-bold">{feat.name}</span>
                          <span className="font-mono text-[10px] text-[#AFA9EC]/70 w-12 shrink-0 text-right">{feat.value.toFixed(2)}</span>
                          
                          {/* Visual progress bar representation */}
                          <div className="flex-1 flex items-center h-5 relative bg-[#16161A] rounded-lg overflow-hidden border border-white/5">
                            {isPositive ? (
                              <div className="w-1/2 ml-auto flex justify-start">
                                <div 
                                  className="bg-red-500/70 h-full rounded-r transition-all duration-500" 
                                  style={{ width: `${widthPercentage}%` }}
                                />
                              </div>
                            ) : (
                              <div className="w-1/2 mr-auto flex justify-end">
                                <div 
                                  className="bg-emerald-500/70 h-full rounded-l transition-all duration-500" 
                                  style={{ width: `${widthPercentage}%` }}
                                />
                              </div>
                            )}
                            
                            <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-white/95 pointer-events-none">
                              impacto: {isPositive ? '+' : ''}{(feat.impact * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-[9px] text-[#AFA9EC]/70 border-t border-[#7F77DD]/10 pt-3 px-12">
                      <span className="text-emerald-400 flex items-center gap-1">← Reduce Riesgo (Normalizar)</span>
                      <span className="text-red-400 flex items-center gap-1">Aumenta Riesgo (Anomalía) →</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          /* REAL-WORLD SECOPS ALERT LOG TAB */
          <div className="space-y-6">
            
            {/* Operational Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#AFA9EC] font-bold uppercase tracking-widest font-mono">Monto Total Protegido</span>
                  <h3 className="text-2xl font-black mt-1 text-[#F0EFFF]">${totalProtectedAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
                    <UserCheck className="w-3.5 h-3.5" />
                    En pérdidas prevenidas
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#AFA9EC] font-bold uppercase tracking-widest font-mono">Alertas Bloqueadas</span>
                  <h3 className="text-2xl font-black mt-1 text-red-400">{fraudPreventedCount}</h3>
                  <p className="text-[10px] text-[#AFA9EC]/60 mt-1 font-mono">Sobre {totalProcessed} transacciones auditadas</p>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#AFA9EC] font-bold uppercase tracking-widest font-mono">Latencia de Respuesta</span>
                  <h3 className="text-2xl font-black mt-1 text-[#7F77DD]">8 ms</h3>
                  <p className="text-[10px] text-emerald-400/80 mt-1 font-mono">Falsos bloqueos evitados: 99.97%</p>
                </div>
                <div className="p-3 bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-[#7F77DD] rounded-2xl">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
              </div>

            </div>

            {/* Alert List Log Table */}
            <div className="bg-[#2C2C2A] p-6 rounded-3xl border border-[#7F77DD]/10 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wide">Registro Operativo de Alertas</h3>
                  <p className="text-xs text-[#F0EFFF]/60">Monitoreo de transacciones con puntajes sospechosos en la sesión actual</p>
                </div>
                <button 
                  onClick={() => setAlertLogs([])}
                  className="px-4 py-2 bg-[#16161A] hover:bg-[#16161A]/80 border border-[#7F77DD]/10 text-[#AFA9EC] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Limpiar Registro
                </button>
              </div>

              {alertLogs.length === 0 ? (
                <div className="text-center py-12 text-[#F0EFFF]/40 flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-10 h-10 text-[#7F77DD]/30" />
                  <p className="text-xs">No hay transacciones registradas en el log.</p>
                  <p className="text-[10px] text-[#AFA9EC]/60">Evalúa una transacción en el simulador para que aparezca aquí automáticamente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#7F77DD]/10 text-[#AFA9EC] uppercase tracking-wider text-[10px] font-mono">
                        <th className="pb-3 font-semibold">ID Transacción</th>
                        <th className="pb-3 font-semibold">Hora / Timestamp</th>
                        <th className="pb-3 font-semibold">Número Tarjeta</th>
                        <th className="pb-3 font-semibold text-right">Monto</th>
                        <th className="pb-3 font-semibold text-center">Score de Riesgo</th>
                        <th className="pb-3 font-semibold text-center">Estado</th>
                        <th className="pb-3 font-semibold pl-4">Acción / Resolución</th>
                        <th className="pb-3 font-semibold text-right">Acciones manuales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7F77DD]/5 font-mono">
                      {alertLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#16161A]/20 transition-colors">
                          <td className="py-4 font-bold text-[#F0EFFF]">{log.id}</td>
                          <td className="py-4 text-[#F0EFFF]/70">{log.time}</td>
                          <td className="py-4 text-[#F0EFFF]/60">{log.card}</td>
                          <td className="py-4 text-right font-bold text-[#F0EFFF]">${log.amount.toFixed(2)}</td>
                          <td className="py-4 text-center">
                            <span className={`font-bold ${log.risk > 0.5 ? 'text-red-400' : log.risk > 0.15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {(log.risk * 100).toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              log.status === 'BLOCKED' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                              log.status === 'REVIEW' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {log.status === 'BLOCKED' ? 'BLOQUEADA' : log.status === 'REVIEW' ? 'EN REVISIÓN' : 'APROBADA'}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-[#AFA9EC] italic text-[11px] font-sans">{log.actionTaken}</td>
                          <td className="py-4 text-right">
                            {log.status === 'REVIEW' ? (
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleResolveAlert(log.id, 'Liberada tras verificación manual')}
                                  title="Aprobar Transacción"
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleResolveAlert(log.id, 'Bloqueo definitivo de cuenta')}
                                  title="Confirmar Fraude"
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : log.status === 'BLOCKED' ? (
                              <button 
                                onClick={() => handleResolveAlert(log.id, 'Liberada y cuenta desbloqueada')}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase transition-all"
                              >
                                Desbloquear
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#F0EFFF]/35">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#7F77DD]/10 bg-[#2C2C2A]/25 py-6 text-center text-xs text-[#AFA9EC]/60 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Portafolio Profesional de Ingeniería en Informática</p>
          <div className="flex gap-4">
            <span className="hover:text-[#F0EFFF] transition-colors">FastAPI Backend</span>
            <span>·</span>
            <span className="hover:text-[#F0EFFF] transition-colors">XGBoost Classifier</span>
            <span>·</span>
            <span className="hover:text-[#F0EFFF] transition-colors">Next.js Frontend</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
