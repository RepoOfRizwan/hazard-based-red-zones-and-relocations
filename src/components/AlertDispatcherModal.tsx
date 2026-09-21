import React, { useState } from 'react';
import { AlertNotification } from '../types';
import {
  X,
  Copy,
  Check,
  Send,
  Radio,
  MessageSquare,
  Smartphone,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

interface AlertDispatcherModalProps {
  alert: AlertNotification | null;
  onClose: () => void;
}

export const AlertDispatcherModal: React.FC<AlertDispatcherModalProps> = ({ alert, onClose }) => {
  const [activeTab, setActiveTab] = useState<'WHATSAPP' | 'SMS' | 'CAP_XML'>('WHATSAPP');
  const [copied, setCopied] = useState(false);
  const [isBroadcasted, setIsBroadcasted] = useState(false);

  if (!alert) return null;

  const currentPayload =
    activeTab === 'WHATSAPP'
      ? alert.whatsapp_preview
      : activeTab === 'SMS'
      ? alert.sms_preview
      : alert.cap_xml_preview;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateBroadcast = () => {
    setIsBroadcasted(true);
    // Play tactical confirmation sound via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before interaction
    }

    setTimeout(() => {
      setIsBroadcasted(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="alert-dispatcher-modal"
        className="bg-[#111827] border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-[#0e1626] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Emergency Alert Dispatch Simulator
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                  {alert.severity}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Target: {alert.habitation_name} • Alert ID: {alert.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selection Tabs */}
        <div className="flex border-b border-gray-800 bg-[#0d1322] px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('WHATSAPP')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeTab === 'WHATSAPP'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab('SMS')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeTab === 'SMS'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS Flash Alert</span>
          </button>

          <button
            onClick={() => setActiveTab('CAP_XML')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeTab === 'CAP_XML'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>NDMA Sachet CAP XML</span>
          </button>
        </div>

        {/* Payload Preview Body */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#090d16]">
          {activeTab === 'WHATSAPP' && (
            <div className="bg-[#11221b] border border-emerald-800/60 rounded-lg p-4 font-mono text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed shadow-inner">
              {alert.whatsapp_preview}
            </div>
          )}

          {activeTab === 'SMS' && (
            <div>
              <div className="bg-[#121c2c] border border-cyan-800/60 rounded-lg p-4 font-mono text-xs text-cyan-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                {alert.sms_preview}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-2 px-1">
                <span>Character Count: {alert.sms_preview.length} chars</span>
                <span>TRAI / CBS Multi-Carrier Compatible</span>
              </div>
            </div>
          )}

          {activeTab === 'CAP_XML' && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-[11px] text-amber-200/90 whitespace-pre overflow-x-auto leading-tight shadow-inner">
              {alert.cap_xml_preview}
            </div>
          )}

          {isBroadcasted && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>SIMULATION BROADCAST SUCCESS:</strong> Alert payload transmitted to
                NDMA Sachet Gateway & 1,420 registered cell tower subscribers in {alert.habitation_name}!
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#0e1626] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Payload</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-xs font-medium"
            >
              Dismiss
            </button>
            <button
              onClick={handleSimulateBroadcast}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/40 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Emergency Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
