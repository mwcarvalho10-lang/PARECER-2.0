import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Save } from 'lucide-react';

interface DocumentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  onSave: (newConfig: any) => void;
}

export function DocumentConfigModal({ isOpen, onClose, config, onSave }: DocumentConfigModalProps) {
  const [localConfig, setLocalConfig] = useState(config || {
    schoolName: "E. M. RAYMUNDO LEMOS SANTANA",
    teacherName: "",
    principalName: "",
    year: new Date().getFullYear().toString(),
    logoBase64: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalConfig({ ...localConfig, logoBase64: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: string, value: string) => {
    setLocalConfig({ ...localConfig, [field]: value });
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
            Configuração do Documento
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome da Escola</label>
            <input 
              type="text"
              value={localConfig.schoolName}
              onChange={(e) => handleChange('schoolName', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 uppercase transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Professor</label>
            <input 
              type="text"
              value={localConfig.teacherName}
              onChange={(e) => handleChange('teacherName', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 uppercase transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Direção</label>
            <input 
              type="text"
              value={localConfig.principalName}
              onChange={(e) => handleChange('principalName', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 uppercase transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ano Letivo</label>
            <input 
              type="text"
              value={localConfig.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 uppercase transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Logo da Escola (Timbre)</label>
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              className="hidden" 
            />
            <div className="flex gap-4 items-center">
              {localConfig.logoBase64 && (
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localConfig.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-amber-200 transition-colors border border-amber-200"
              >
                <ImageIcon className="w-4 h-4" />
                {localConfig.logoBase64 ? 'Trocar Logo' : 'Enviar Logo'}
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-xs font-black uppercase text-slate-500 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 py-3 text-xs font-black uppercase text-white bg-escola-azul hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
