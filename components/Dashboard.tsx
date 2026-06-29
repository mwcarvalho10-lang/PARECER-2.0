import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, BookOpen, ChevronDown, ChevronUp, Settings, Lock, Edit2, Check, UserPlus, Trash2, Users, Download, Upload } from 'lucide-react';
import { gradesArr, lettersArr, PIN_CONFIG } from '@/lib/constants';
import { PinModal } from './PinModal';
import { AppData, Teacher } from '@/lib/types';

interface DashboardProps {
  appData: AppData;
  onSelectClass: (grade: string, letter: string) => void;
}

export function Dashboard({ appData, onSelectClass }: DashboardProps) {
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{ g: number | null; l: string | null; isAdmin?: boolean }>({ g: null, l: null });
  const [currentPin, setCurrentPin] = useState("");
  const [isError, setIsError] = useState(false);
  
  const [classPins, setClassPins] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPins = localStorage.getItem('edu_pins_v13');
    if (savedPins) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClassPins(JSON.parse(savedPins));
    } else {
      const initialPins: Record<string, string> = {};
      gradesArr.forEach(g => {
        lettersArr.forEach(l => {
          initialPins[`${g}${l}`] = PIN_CONFIG[g.toString()];
        });
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClassPins(initialPins);
      localStorage.setItem('edu_pins_v13', JSON.stringify(initialPins));
    }

    const savedTeachers = localStorage.getItem('edu_teachers_v13');
    if (savedTeachers) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeachers(JSON.parse(savedTeachers));
    }
  }, []);

  const handlePinChange = (pin: string) => {
    if (isError) return;
    setCurrentPin(pin);
    
    // Admin password length is 7 ('adm2026') but pin modal only handles numbers if we click, 
    // however keyboard allows any string. Wait, if it's admin, they might type letters. 
    // PinModal will need to support arbitrary length for admin. Let's just check dynamically.
    if (pendingSelection.isAdmin) {
      if (pin.length >= 7) {
        if (pin.toLowerCase() === 'adm2026') {
          setIsAdminAuth(true);
          setPinModalOpen(false);
        } else {
          setIsError(true);
          setTimeout(() => { setCurrentPin(""); setIsError(false); }, 500);
        }
      }
    } else {
      if (pin.length === 5) {
        const classKey = `${pendingSelection.g}${pendingSelection.l}`;
        const correctPin = classPins[classKey] || PIN_CONFIG[pendingSelection.g!.toString()];
        
        if (pendingSelection.g && pin === correctPin) {
          onSelectClass(pendingSelection.g.toString(), pendingSelection.l!);
          setPinModalOpen(false);
        } else {
          setIsError(true);
          setTimeout(() => { setCurrentPin(""); setIsError(false); }, 500);
        }
      }
    }
  };

  const openPinModal = (g: number, l: string) => {
    setPendingSelection({ g, l });
    setCurrentPin("");
    setPinModalOpen(true);
  };

  const openAdminModal = () => {
    setPendingSelection({ g: null, l: null, isAdmin: true });
    setCurrentPin("");
    setPinModalOpen(true);
  };

  const getGradeColor = (g: number) => {
    switch(g) {
      case 1: return '#0ea5e9';
      case 2: return '#7fb432';
      case 3: return '#f59e0b';
      case 4: return '#8b5cf6';
      case 5: return '#005bb7';
      default: return '#0ea5e9';
    }
  };

  const handleSaveNewPin = (classKey: string) => {
    if (newPinValue.length !== 5) {
      alert("A senha deve ter exatamente 5 dígitos numéricos.");
      return;
    }
    const updatedPins = { ...classPins, [classKey]: newPinValue };
    setClassPins(updatedPins);
    localStorage.setItem('edu_pins_v13', JSON.stringify(updatedPins));
    setEditingPin(null);
    setNewPinValue("");
  };

  const handleSaveTeacher = () => {
    if (!newTeacherName) return;
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name: newTeacherName,
      classes: newTeacherClasses
    };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    localStorage.setItem('edu_teachers_v13', JSON.stringify(updated));
    setNewTeacherName("");
    setNewTeacherClasses([]);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Remover este professor?")) {
      const updated = teachers.filter(t => t.id !== id);
      setTeachers(updated);
      localStorage.setItem('edu_teachers_v13', JSON.stringify(updated));
    }
  };

  const toggleTeacherClass = (classKey: string) => {
    setNewTeacherClasses(prev => 
      prev.includes(classKey) ? prev.filter(k => k !== classKey) : [...prev, classKey]
    );
  };

  const handleExportBackup = () => {
    const backupData = {
      appData: localStorage.getItem('edu_data_v13'),
      pins: localStorage.getItem('edu_pins_v13'),
      teachers: localStorage.getItem('edu_teachers_v13'),
      version: '13',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_painel_pedagogico_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.version && json.appData !== undefined) {
          if (json.appData) localStorage.setItem('edu_data_v13', json.appData);
          if (json.pins) localStorage.setItem('edu_pins_v13', json.pins);
          if (json.teachers) localStorage.setItem('edu_teachers_v13', json.teachers);
          alert("Backup restaurado com sucesso! A página será recarregada.");
          window.location.reload();
        } else {
          alert("Arquivo de backup inválido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo de backup.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="nordeste-bg h-full overflow-y-auto relative">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={isAdminAuth ? () => setIsAdminAuth(false) : openAdminModal} 
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md text-slate-700 rounded-full shadow-sm border border-slate-200 hover:bg-white text-xs font-bold uppercase transition-all"
        >
          {isAdminAuth ? <Lock className="w-4 h-4 text-red-500" /> : <Settings className="w-4 h-4 text-slate-400" />}
          {isAdminAuth ? "Sair do Adm" : "Admin"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <header className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center border-4 border-amber-100">
              <GraduationCap className="w-10 h-10 text-amber-700" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-amber-900 uppercase drop-shadow-sm font-serif">Painel Pedagógico</h1>
          <p className="text-amber-700/80 font-black uppercase tracking-[0.3em] text-[11px] mt-2">E. M. Raymundo Lemos Santana</p>
        </header>
        
        {isAdminAuth ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-amber-200">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Users className="text-amber-500" /> Cadastro de Professores
              </h2>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <h3 className="text-sm font-black text-slate-600 uppercase mb-3">Novo Professor</h3>
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="Nome do Professor"
                    className="w-full bg-white px-4 py-2 rounded-xl text-sm font-bold outline-none border border-slate-300 focus:border-amber-400 uppercase"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Turmas Vinculadas:</span>
                    <div className="flex flex-wrap gap-2">
                      {gradesArr.map(g => 
                        lettersArr.map(l => {
                          const key = `${g}${l}`;
                          const isSelected = newTeacherClasses.includes(key);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleTeacherClass(key)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${isSelected ? 'bg-amber-100 text-amber-700 border-amber-300 border' : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-200'}`}
                            >
                              {key}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveTeacher}
                    className="self-end bg-amber-500 text-white px-4 py-2 rounded-xl font-bold uppercase text-xs hover:bg-amber-600 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Salvar Professor
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {teachers.length === 0 && (
                  <p className="text-xs text-slate-400 font-bold uppercase text-center py-4">Nenhum professor cadastrado.</p>
                )}
                {teachers.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-black text-slate-800 uppercase">{t.name}</span>
                      <div className="flex gap-1 mt-1">
                        {t.classes.map(c => (
                          <span key={c} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{c}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-amber-200">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Settings className="text-amber-500" /> Administração de Senhas
              </h2>
              <div className="space-y-6">
              {gradesArr.map(g => (
                <div key={g} className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <h3 className="text-sm font-black text-slate-500 uppercase mb-3">{g}º Ano</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {lettersArr.map(l => {
                      const classKey = `${g}${l}`;
                      const isEditing = editingPin === classKey;
                      const currentClassPin = classPins[classKey] || PIN_CONFIG[g.toString()];
                      
                      return (
                        <div key={l} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="block text-lg font-black text-slate-800 uppercase">{l}</span>
                            {isEditing ? (
                              <input 
                                type="text" 
                                maxLength={5}
                                value={newPinValue}
                                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                                className="w-16 bg-slate-100 px-2 py-1 rounded text-xs font-bold outline-none border border-slate-300 focus:border-amber-400 mt-1"
                                placeholder="5 dígitos"
                                autoFocus
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Senha: {currentClassPin}</span>
                            )}
                          </div>
                          {isEditing ? (
                            <button onClick={() => handleSaveNewPin(classKey)} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => { setEditingPin(classKey); setNewPinValue(currentClassPin); }} className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-amber-200">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Download className="text-amber-500" /> Backup e Restauração
              </h2>
              <div className="flex gap-4">
                <button 
                  onClick={handleExportBackup}
                  className="bg-amber-50 text-amber-700 px-6 py-3 rounded-xl font-bold uppercase text-xs border border-amber-200 hover:bg-amber-100 hover:border-amber-300 flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Exportar Dados (Backup)
                </button>
                
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImportBackup} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold uppercase text-xs border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex-1 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Importar Dados (Restaurar)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 text-center">
                O arquivo de backup contém todas as turmas, alunos, habilidades marcadas e senhas.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {teachers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest px-2">Acesso Rápido - Professores</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {teachers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherId(selectedTeacherId === t.id ? null : t.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${selectedTeacherId === t.id ? 'bg-amber-50 border-amber-300 shadow-md' : 'bg-white/95 backdrop-blur-sm border-amber-100 hover:border-amber-200 hover:shadow-sm'}`}
                    >
                      <span className="block text-sm font-black text-slate-800 uppercase mb-1">{t.name}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{t.classes.length} Turmas</span>
                    </button>
                  ))}
                </div>
                
                {selectedTeacherId && (
                  <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-amber-200 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-xs font-black text-slate-700 uppercase mb-3">Selecione sua turma:</h3>
                    <div className="flex flex-wrap gap-2">
                      {teachers.find(t => t.id === selectedTeacherId)?.classes.map(c => {
                        const g = parseInt(c[0]);
                        const l = c.substring(1);
                        return (
                          <button
                            key={c}
                            onClick={() => openPinModal(g, l)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-4 py-2 rounded-xl font-black text-lg transition-colors"
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest px-2">Todas as Turmas</h2>
              {gradesArr.map(g => {
                const isActive = openYear === g;
              const gradeColor = getGradeColor(g);
              return (
                <div key={g} style={{ '--grade-color': gradeColor } as React.CSSProperties}>
                  <button 
                    onClick={() => setOpenYear(isActive ? null : g)} 
                    className={`w-full flex items-center justify-between p-6 rounded-2xl bg-white/95 backdrop-blur-sm border transition-all duration-300 ${isActive ? 'shadow-lg border-amber-300/50 ring-1 ring-amber-300/30' : 'border-amber-100 hover:shadow-md hover:border-amber-200'}`}
                    style={{ borderLeftColor: isActive ? gradeColor : undefined, borderLeftWidth: isActive ? '4px' : '1px' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 relative flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'text-white shadow-inner' : 'bg-amber-50 text-amber-600'}`} style={{ backgroundColor: isActive ? gradeColor : undefined }}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black uppercase text-slate-800">{g}º ANO</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ensino Fundamental</p>
                      </div>
                    </div>
                    {isActive ? <ChevronUp className="w-5 h-5 text-amber-700/50" /> : <ChevronDown className="w-5 h-5 text-amber-700/50" />}
                  </button>
                  
                  {isActive && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 px-2 animate-in slide-in-from-top-2 duration-300">
                      {lettersArr.map(l => {
                        const classData = appData[`${g}${l}`];
                        const count = classData?.students?.filter(s => classData[s]?.active !== false).length || 0;
                        return (
                          <div 
                            key={l} 
                            onClick={() => openPinModal(g, l)} 
                            className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-amber-100 cursor-pointer hover:border-amber-300 hover:shadow-lg hover:-translate-y-1 text-center group transition-all"
                          >
                            <span className="block text-2xl font-black text-slate-800 uppercase group-hover:text-amber-600 transition-colors">{l}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{count} Alunos</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      <PinModal 
        isOpen={pinModalOpen}
        targetGrade={pendingSelection.g}
        targetLetter={pendingSelection.l}
        isAdmin={pendingSelection.isAdmin}
        currentPin={currentPin}
        isError={isError}
        onPinChange={handlePinChange}
        onCancel={() => setPinModalOpen(false)}
      />
    </div>
  );
}
