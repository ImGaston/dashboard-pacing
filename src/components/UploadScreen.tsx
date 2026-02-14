import React, { useCallback, useState } from 'react';
import { Upload, FileCheck, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { cn } from '../lib/utils';

interface UploadScreenProps {
    onUpload: (filePrevious: File, fileCurrent: File, date: Date) => void;
    isProcessing: boolean;
}

const UploadZone = ({
    file,
    onClear,
    getRootProps,
    getInputProps,
    isDragActive,
    label
}: {
    file: File | null,
    onClear: () => void,
    getRootProps: any,
    getInputProps: any,
    isDragActive: boolean,
    label: string
}) => {
    if (file) {
        return (
            <div className="relative border-2 border-cedar bg-cedar/5 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300">
                <button onClick={onClear} className="absolute top-2 right-2 p-1 text-moss hover:text-red-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                    <FileCheck className="w-6 h-6 text-cedar" />
                </div>
                <p className="text-sm font-bold text-onyx truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-moss mt-1">{label} Ready</p>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group h-full",
                isDragActive ? "border-cedar bg-cedar/5" : "border-moss/30 hover:border-cedar hover:bg-white/60"
            )}
        >
            <input {...getInputProps()} />
            <div className="bg-bone p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-cedar" />
            </div>
            <p className="text-sm font-medium text-onyx mb-1">{label}</p>
            <p className="text-xs text-moss">Drop CSV here</p>
        </div>
    );
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ onUpload, isProcessing }) => {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [filePrev, setFilePrev] = useState<File | null>(null);
    const [fileCurr, setFileCurr] = useState<File | null>(null);

    const handleDropPrev = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles.length > 0) setFilePrev(acceptedFiles[0]);
        if (fileRejections.length > 0) {
            const errorMsg = fileRejections[0].errors[0].message;
            alert(`Could not upload file: ${errorMsg}. Please ensure it is a CSV file.`);
        }
    }, []);

    const handleDropCurr = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles.length > 0) setFileCurr(acceptedFiles[0]);
        if (fileRejections.length > 0) {
            const errorMsg = fileRejections[0].errors[0].message;
            alert(`Could not upload file: ${errorMsg}. Please ensure it is a CSV file.`);
        }
    }, []);

    const dropzoneConfig = {
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv'],
            'text/plain': ['.csv'],
            'application/csv': ['.csv'],
            'text/x-csv': ['.csv']
        },
        multiple: false
    };

    const { getRootProps: getRootPropsPrev, getInputProps: getInputPropsPrev, isDragActive: isDragActivePrev } = useDropzone({
        onDrop: handleDropPrev,
        ...dropzoneConfig
    });

    const { getRootProps: getRootPropsCurr, getInputProps: getInputPropsCurr, isDragActive: isDragActiveCurr } = useDropzone({
        onDrop: handleDropCurr,
        ...dropzoneConfig
    });

    const handleGenerate = () => {
        if (filePrev && fileCurr) {
            onUpload(filePrev, fileCurr, new Date(date));
        }
    };

    return (
        <div className="min-h-screen bg-bone flex flex-col items-center justify-center p-4 font-sans text-tobacco">
            <div className="w-full max-w-2xl space-y-8 animate-fade-in">
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-serif text-onyx italic">revfactor</h1>
                    <p className="text-moss tracking-widest text-sm uppercase">Pacing Dashboard</p>
                </div>

                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/60 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UploadZone
                            file={filePrev}
                            onClear={() => setFilePrev(null)}
                            getRootProps={getRootPropsPrev}
                            getInputProps={getInputPropsPrev}
                            isDragActive={isDragActivePrev}
                            label="Previous Year CSV (e.g. 2025)"
                        />
                        <UploadZone
                            file={fileCurr}
                            onClear={() => setFileCurr(null)}
                            getRootProps={getRootPropsCurr}
                            getInputProps={getInputPropsCurr}
                            isDragActive={isDragActiveCurr}
                            label="Current Year CSV (e.g. 2026)"
                        />
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-tobacco uppercase tracking-wide ml-1">Comparison Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-3 bg-white border border-moss/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cedar/20 text-onyx font-sans"
                            />
                        </div>

                        <button
                            disabled={isProcessing || !filePrev || !fileCurr}
                            className={cn(
                                "w-full py-4 bg-cedar text-bone font-bold tracking-widest rounded-lg hover:bg-onyx transition-colors shadow-lg active:scale-95 duration-200",
                                (isProcessing || !filePrev || !fileCurr) && "opacity-70 cursor-not-allowed"
                            )}
                            onClick={handleGenerate}
                        >
                            {isProcessing ? "PROCESSING..." : "GENERATE DASHBOARD"}
                        </button>
                        <p className="text-xs text-center text-moss/60 mt-2">
                            Upload both files to generate dashboard.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
