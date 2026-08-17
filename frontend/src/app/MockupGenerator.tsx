import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Menu, Info, Share2, MousePointer2, Hand, ZoomIn, ZoomOut, Maximize, Plus, Minus, Download, Upload, X, LayoutTemplate, Wand2, Grid, Image as ImageIcon } from 'lucide-react';
import TuckBox3D from './models/TuckBox3D';
import DielineEditor from './DielineEditor';
import './MockupGenerator.css';

export interface PlacedImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  face: string;
  side: 'outside' | 'inside';
}

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export default function MockupGenerator({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'landing' | 'editor'>('landing');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [placedImages, setPlacedImages] = useState<PlacedImage[]>([]);
  
  const [activeSide, setActiveSide] = useState<'outside' | 'inside'>('outside');
  const [packageMaterial, setPackageMaterial] = useState<'white' | 'kraft'>('white');
  const [boxOpenProgress, setBoxOpenProgress] = useState<number>(0);
  
  const packageColor = packageMaterial === 'white' ? '#ffffff' : '#d9b99b';
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImgUrl = event.target.result as string;
          
          setUploadedImages(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            url: newImgUrl,
            name: file.name
          }]);
          
          if (placedImages.length === 0) {
            setPlacedImages([{
              id: Math.random().toString(36).substr(2, 9),
              url: newImgUrl,
              x: 20,
              y: 20,
              width: 140,
              height: 140,
              rotation: 0,
              face: 'front',
              side: 'outside'
            }]);
          }
          
          setStep('editor');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const updatePlacedImage = (id: string, updates: Partial<PlacedImage>) => {
    setPlacedImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };
  
  const removePlacedImage = (id: string) => {
    setPlacedImages(prev => prev.filter(img => img.id !== id));
  };

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#e5e5e5] font-sans flex flex-col">
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer" onClick={onBack}>
                <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16l-9 5-9-5V8l9-5 9 5v8z"/></svg>
                </div>
                Mockup Generator
             </div>
             <Menu className="w-5 h-5 text-gray-400 ml-2" />
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 border border-yellow-400 text-yellow-600 rounded-full text-[13px] font-bold flex items-center gap-2 bg-yellow-50">
               ✨ 2960 credits <span>+</span>
             </div>
             <button className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2">
               3D Design ↗
             </button>
             <button className="p-2 text-gray-500 hover:text-gray-800"><Share2 className="w-5 h-5" /></button>
             <button className="px-6 py-2 bg-[#8b5cf6] text-white rounded-lg text-[13px] font-medium hover:bg-purple-600">
               Super export
             </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[70px] bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6 z-10 shrink-0">
             <button className="flex flex-col items-center gap-1 text-[#8b5cf6]">
               <Wand2 className="w-5 h-5" />
               <span className="text-[10px] font-medium">Edit</span>
             </button>
             <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 16-9 5-9-5V8l9-5 9 5v8z"/></svg>
               <span className="text-[10px] font-medium">Models</span>
             </button>
             <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700">
               <LayoutTemplate className="w-5 h-5" />
               <span className="text-[10px] font-medium">Layout</span>
             </button>
          </aside>

          <div className="w-[320px] p-6 shrink-0 flex flex-col h-full overflow-y-auto">
             <div className="bg-white rounded-[16px] shadow-sm p-4 flex flex-col gap-4 border border-gray-100">
                <h2 className="font-bold text-[15px] text-gray-800">Upload images</h2>
                
                <div className="border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
                  <ImageIcon className="w-10 h-10 text-purple-300" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-[#8b5cf6] text-white rounded-lg text-[14px] font-medium hover:bg-purple-600 flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*"
                    multiple
                  />
                </div>

                <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200">
                  No design yet? Create with AI ✨
                </button>
                
                <p className="text-center text-[12px] text-gray-500 cursor-pointer hover:text-gray-800">
                  Or download dieline(AI, PDF)
                </p>

                <div className="h-[1px] bg-gray-100 my-2"></div>

                <div className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">Custom material</span>
                    <select 
                      value={packageMaterial}
                      onChange={(e) => setPackageMaterial(e.target.value as any)}
                      className="bg-transparent text-[13px] font-medium text-gray-800 outline-none cursor-pointer"
                    >
                      <option value="white">White paperboard</option>
                      <option value="kraft">Kraft board</option>
                      <option value="corrugated">Corrugated cardboard</option>
                    </select>
                  </div>
                </div>
             </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-[#f5f5f5]">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <span className="text-gray-400 font-medium">Upload an image to start designing</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // EDITOR STEP
  return (
    <div className="min-h-screen bg-[#e5e5e5] font-sans flex flex-col">
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer" onClick={() => setStep('landing')}>
              <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16l-9 5-9-5V8l9-5 9 5v8z"/></svg>
              </div>
              Mockup Generator
           </div>
           <Menu className="w-5 h-5 text-gray-400 ml-2" />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-2 bg-[#8b5cf6] text-white text-[13px] font-medium rounded-lg hover:bg-purple-600 transition-colors shadow-sm">
            Save
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex h-full border-r border-gray-200 z-10 shadow-sm shrink-0 bg-white">
          <aside className="w-[80px] bg-white flex flex-col items-center py-4 border-r border-gray-100 gap-6">
            <button className="flex flex-col items-center gap-1.5 text-[#8b5cf6]" onClick={() => fileInputRef.current?.click()}>
              <div className="p-2 rounded-xl bg-purple-50">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">Uploads</span>
            </button>
          </aside>

          <div className="w-[280px] bg-white flex flex-col overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
               <h3 className="font-bold text-[14px] text-gray-800">Your Uploads</h3>
               <div className="grid grid-cols-2 gap-2 mt-2">
                 {uploadedImages.map(img => (
                   <div 
                     key={img.id}
                     className="w-full aspect-square border border-gray-200 rounded-lg overflow-hidden hover:border-purple-500 transition-colors relative group cursor-pointer"
                     onClick={() => {
                        setPlacedImages(prev => [...prev, {
                          id: Math.random().toString(36).substr(2, 9),
                          url: img.url,
                          x: 350 + (240 - 140) / 2, 
                          y: 300 + (320 - 140) / 2, 
                          width: 140, height: 140, rotation: 0,
                          face: 'front', side: activeSide
                        }]);
                     }}
                   >
                     <img src={img.url} alt="" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Plus className="w-6 h-6 text-white" />
                     </div>
                   </div>
                 ))}
               </div>
               {placedImages.length === 0 && uploadedImages.length > 0 && (
                 <div className="mt-8 text-center text-gray-400 text-[13px]">
                    Click an image to place it on the box
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col bg-[#f8f9fc]">
           <div className="flex-1 relative">
             <DielineEditor 
               placedImages={placedImages} 
               activeSide={activeSide} 
               updatePlacedImage={updatePlacedImage} 
               removePlacedImage={removePlacedImage} 
               packageColor={packageColor}
             />
           </div>

           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center p-2 gap-1 border border-gray-100">
             <button className="p-2 text-[#8b5cf6] bg-purple-50 rounded-md"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg></button>
             <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md"><Hand className="w-4.5 h-4.5" /></button>
             <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
             <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md"><ZoomOut className="w-4.5 h-4.5" /></button>
             <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md"><ZoomIn className="w-4.5 h-4.5" /></button>
           </div>
        </div>

        <div className="w-[340px] bg-white border-l border-gray-200 shadow-[-4px_0_20px_rgba(0,0,0,0.02)] flex flex-col p-6 overflow-y-auto">
          
          <div className="bg-[#e9eaee] rounded-[20px] p-6 flex flex-col relative h-[360px] mb-6">
             <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10">
                <Maximize className="w-4 h-4" />
             </button>
             
             <div className="flex-1 relative flex items-center justify-center">
               <div className="transform scale-[0.6] origin-center w-full h-full flex items-center justify-center">
                 <TuckBox3D 
                   placedImages={placedImages} 
                   packageColor={packageColor} 
                   activeSide={activeSide} 
                   openProgress={boxOpenProgress} 
                 />
               </div>
             </div>

             <div className="bg-white/80 backdrop-blur rounded-full px-4 py-2 mt-4 flex items-center gap-3 shadow-sm border border-white/50">
               <span className="text-[12px] font-medium text-gray-600">Open</span>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={boxOpenProgress} 
                 onChange={(e) => setBoxOpenProgress(Number(e.target.value))}
                 className="flex-1 accent-gray-400 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
               />
               <span className="text-[12px] font-medium text-gray-600">Close</span>
             </div>
          </div>

          <div className="flex rounded-lg bg-[#f1f5f9] p-1 gap-1 mb-6">
            <button 
              onClick={() => setActiveSide('outside')}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded ${activeSide === 'outside' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Outside
            </button>
            <button 
              onClick={() => setActiveSide('inside')}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded ${activeSide === 'inside' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Inside
            </button>
          </div>

          <div className="flex flex-col gap-3">
             <span className="text-[13px] font-bold text-gray-800">Package Color</span>
             <div className="flex gap-2">
                {['#ffffff', '#f8fafc', '#d9b99b', '#fcd34d', '#f472b6', '#4ade80'].map(c => (
                  <button 
                    key={c}
                    onClick={() => {
                      if (c === '#ffffff') setPackageMaterial('white');
                      else if (c === '#d9b99b') setPackageMaterial('kraft');
                    }}
                    className={`w-6 h-6 rounded-full border border-gray-200 shadow-sm ${packageColor === c ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}