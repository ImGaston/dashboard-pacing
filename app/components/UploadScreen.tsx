"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileCheck, X, FileSpreadsheet, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { parseCSV, detectPMS } from '@/utils/csvParser';
import type { Reservation, PMSType, PMSColumnMapping } from '@/types';

interface UploadScreenProps {
    onDataReady: (data: Reservation[], date: Date) => void;
}

// --- Sub-components ---

const PMSSignupCard = ({
    title,
    description,
    onClick,
    isSelected,
    icon: Icon
}: {
    title: string;
    description: string;
    onClick: () => void;
    isSelected: boolean;
    icon?: React.ElementType;
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer rounded-[12px] p-6 border transition-all duration-200 flex flex-col items-center text-center space-y-3 h-full hover:shadow-[0_2px_6px_rgba(22,25,16,0.06),0_8px_24px_rgba(22,25,16,0.10)]",
                isSelected
                    ? "bg-cedar border-cedar text-bone shadow-lg scale-105"
                    : "bg-bone-light border-bone-dark hover:border-cedar text-onyx"
            )}
        >
            <div className={cn("p-3 rounded-full mb-1", isSelected ? "bg-bone/10" : "bg-bone-muted")}>
                {Icon ? <Icon className={cn("w-6 h-6", isSelected ? "text-bone" : "text-cedar")} /> : <FileSpreadsheet className={cn("w-6 h-6", isSelected ? "text-bone" : "text-cedar")} />}
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">{title}</h3>
            <p className={cn("text-xs leading-relaxed", isSelected ? "text-bone/80" : "text-moss")}>
                {description}
            </p>
        </div>
    );
};

const UploadZone = ({
    file,
    onClear,
    onDrop,
    label,
    heightClass = "h-40"
}: {
    file: File | null,
    onClear: () => void,
    onDrop: (acceptedFiles: File[]) => void,
    label: string,
    heightClass?: string
}) => {
    const handleDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles.length > 0) onDrop(acceptedFiles);
        if (fileRejections.length > 0) {
            alert(`Could not upload file: ${fileRejections[0].errors[0].message}`);
        }
    }, [onDrop]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'], 'text/plain': ['.csv'] },
        multiple: false,
        disabled: !!file
    });

    if (file) {
        return (
            <div className={cn("relative border-2 border-cedar bg-cedar/5 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300", heightClass)}>
                <button onClick={onClear} className="absolute top-2 right-2 p-1 text-moss hover:text-red-600 transition-colors z-10">
                    <X className="w-5 h-5" />
                </button>
                <div className="bg-bone-light p-3 rounded-full mb-3 shadow-sm">
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
                "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group",
                heightClass,
                isDragActive ? "border-cedar bg-cedar/5" : "border-moss/30 hover:border-cedar hover:bg-bone-light/60"
            )}
        >
            <input {...getInputProps()} />
            <div className="bg-bone-muted p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-cedar" />
            </div>
            <p className="text-sm font-medium text-onyx mb-1">{label}</p>
            <p className="text-xs text-moss">Drop CSV here</p>
        </div>
    );
};

// --- Main Component ---

export const UploadScreen: React.FC<UploadScreenProps> = ({ onDataReady }) => {
    // Steps: 1 = Selection, 2 = Upload/Map
    const [step, setStep] = useState<1 | 2>(1);
    const [pms, setPms] = useState<PMSType | null>(null);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    // File State
    const [hostawayFiles, setHostawayFiles] = useState<{ prev: File | null; curr: File | null }>({ prev: null, curr: null });
    const [singleFile, setSingleFile] = useState<File | null>(null);

    // Verification State
    const [validationSummary, setValidationSummary] = useState<{ count: number; cancelled: number; properties: string[]; dateRange: string } | null>(null);
    const [parsedData, setParsedData] = useState<Reservation[]>([]);

    // Custom Mapping State
    const [customHeaders, setCustomHeaders] = useState<string[]>([]);
    const [customMapping, setCustomMapping] = useState<PMSColumnMapping>({
        checkin: '', checkout: '', bookingDate: '', property: '', channel: '', revenue: '', nights: ''
    });
    const [customStatusCol, setCustomStatusCol] = useState<string>('');
    const [customStatusFilter, setCustomStatusFilter] = useState<string>('accepted');

    useEffect(() => {
        // Reset state when switching PMS
        setHostawayFiles({ prev: null, curr: null });
        setSingleFile(null);
        setValidationSummary(null);
        setParsedData([]);
        setCustomHeaders([]);
    }, [pms]);

    // Handlers
    const handleHostawayDrop = (type: 'prev' | 'curr') => (files: File[]) => {
        setHostawayFiles(prev => ({ ...prev, [type]: files[0] }));
    };

    const handleSingleFileDrop = async (files: File[]) => {
        const file = files[0];
        setSingleFile(file);

        if (pms === 'custom') {
            // Read headers for mapping
            const text = await file.text();
            const firstLine = text.split('\n')[0];
            const headers = firstLine.split(',').map(h => h.replace(/"/g, '').trim());
            setCustomHeaders(headers);

            // Auto-detect check
            const detected = detectPMS(headers);
            if (detected !== 'unknown' && detected !== 'custom') {
                if (confirm(`This looks like a ${detected.toUpperCase()} file. Would you like to switch to automatic parsing?`)) {
                    setPms(detected);
                }
            }
        } else if (pms === 'hospitable') {
            // Auto-parse for validation
            setIsProcessing(true);
            try {
                const { reservations, cancelledCount } = await parseCSV(file, 'hospitable');
                setParsedData(reservations);

                // Gen summary
                const properties = Array.from(new Set(reservations.map(r => r.listing)));
                const dates = reservations.map(r => r.checkInDate.getTime()).filter(d => !isNaN(d));
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));

                setValidationSummary({
                    count: reservations.length,
                    cancelled: cancelledCount,
                    properties: properties.slice(0, 3),
                    dateRange: `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`
                });
            } catch (e) {
                console.error(e);
                alert("Failed to parse Hospitable file.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleGenerate = async () => {
        setIsProcessing(true);
        try {
            let finalData: Reservation[] = [];

            if (pms === 'hostaway') {
                if (!hostawayFiles.prev || !hostawayFiles.curr) return;
                const [r1, r2] = await Promise.all([
                    parseCSV(hostawayFiles.prev, 'hostaway'),
                    parseCSV(hostawayFiles.curr, 'hostaway')
                ]);
                finalData = [...r1.reservations, ...r2.reservations];
            } else if (pms === 'hospitable') {
                finalData = parsedData;
            } else if (pms === 'custom') {
                if (!singleFile) return;
                const finalMapping = { ...customMapping };
                if (customStatusCol && customStatusCol !== 'None') {
                    finalMapping.status = customStatusCol;
                }

                const statusFilter = (customStatusCol && customStatusCol !== 'None') ? customStatusFilter : undefined;

                const { reservations } = await parseCSV(singleFile, 'custom', finalMapping, statusFilter);
                finalData = reservations;
            }

            onDataReady(finalData, new Date(date));
        } catch (e) {
            console.error(e);
            alert("Error processing data.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Render Steps

    if (step === 1) {
        return (
            <div className="min-h-screen bg-bone flex flex-col items-center justify-center p-4 font-sans text-tobacco animate-fade-in">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="text-center space-y-2">
                        <p className="text-moss tracking-widest text-sm uppercase">Select Data Source</p>
                    </div>

                    {/* Data requirements guide */}
                    <div className="bg-white border border-bone-dark/30 rounded-xl px-6 py-5 space-y-3 max-w-2xl mx-auto">
                        <p className="text-sm text-tobacco leading-relaxed">
                            Export your <span className="font-semibold text-onyx">reservations report</span> from your PMS as a CSV file. For year-over-year comparison, include data from both the current and previous year.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-moss">
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Check-in date</span>
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Check-out date</span>
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Booking date</span>
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Revenue</span>
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Nights</span>
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Channel / Source</span>
                            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cedar shrink-0" />Property / Listing</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PMSSignupCard
                            title="Hostaway"
                            description="Upload reservation exports for 2025 and 2026 (two files)."
                            onClick={() => { setPms('hostaway'); setStep(2); }}
                            isSelected={false}
                        />
                        <PMSSignupCard
                            title="Hospitable"
                            description="Upload a single reservations export file containing all data."
                            onClick={() => { setPms('hospitable'); setStep(2); }}
                            isSelected={false}
                        />
                        <PMSSignupCard
                            title="Other CSV"
                            description="Map your own columns manually from any CSV export."
                            onClick={() => { setPms('custom'); setStep(2); }}
                            isSelected={false}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bone flex flex-col items-center justify-center p-4 font-sans text-tobacco">
            <div className="w-full max-w-2xl space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <button onClick={() => setStep(1)} className="text-sm font-bold text-moss hover:text-cedar flex items-center gap-1 transition-colors">
                        <RefreshCw className="w-4 h-4" /> CHANGE PMS ({pms?.toUpperCase()})
                    </button>
                    <div className="text-right" />
                </div>

                <div className="bg-bone-light/50 backdrop-blur-sm p-8 rounded-[12px] shadow-[0_1px_3px_rgba(22,25,16,0.04),0_4px_12px_rgba(22,25,16,0.06)] border border-bone-dark/60 space-y-6">

                    {/* HOSTAWAY UPLOAD */}
                    {pms === 'hostaway' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UploadZone
                                file={hostawayFiles.prev}
                                onClear={() => setHostawayFiles(prev => ({ ...prev, prev: null }))}
                                onDrop={handleHostawayDrop('prev')}
                                label="Previous Year CSV"
                            />
                            <UploadZone
                                file={hostawayFiles.curr}
                                onClear={() => setHostawayFiles(prev => ({ ...prev, curr: null }))}
                                onDrop={handleHostawayDrop('curr')}
                                label="Current Year CSV"
                            />
                        </div>
                    )}

                    {/* HOSPITABLE / CUSTOM UPLOAD */}
                    {(pms === 'hospitable' || pms === 'custom') && (
                        <UploadZone
                            file={singleFile}
                            onClear={() => {
                                setSingleFile(null);
                                setValidationSummary(null);
                                setCustomHeaders([]);
                            }}
                            onDrop={handleSingleFileDrop}
                            label={pms === 'hospitable' ? "Hospitable Export" : "Your CSV File"}
                            heightClass="h-48"
                        />
                    )}

                    {/* CUSTOM MAPPING UI */}
                    {pms === 'custom' && singleFile && customHeaders.length > 0 && (
                        <div className="bg-bone-light p-4 rounded-[12px] border border-bone-dark space-y-4">
                            <h3 className="font-bold text-onyx text-sm uppercase">Map Columns</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {Object.keys(customMapping).map((key) => {
                                    if (key === 'status') return null;
                                    return (
                                        <div key={key} className="space-y-1">
                                            <label className="text-xs font-bold text-moss uppercase">{key}</label>
                                            <select
                                                className="w-full p-2 bg-bone-muted border border-moss/20 rounded"
                                                value={(customMapping as any)[key]}
                                                onChange={(e) => setCustomMapping(prev => ({ ...prev, [key]: e.target.value }))}
                                            >
                                                <option value="">Select Column</option>
                                                {customHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    );
                                })}

                                <div className="col-span-1 md:col-span-2 pt-4 border-t border-moss/10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-moss uppercase">Status Column (Optional)</label>
                                            <select
                                                className="w-full p-2 bg-bone-muted border border-moss/20 rounded"
                                                value={customStatusCol}
                                                onChange={(e) => setCustomStatusCol(e.target.value)}
                                            >
                                                <option value="">None</option>
                                                {customHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                        {customStatusCol && customStatusCol !== '' && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-moss uppercase">Include if equals</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 bg-bone-muted border border-moss/20 rounded"
                                                    value={customStatusFilter}
                                                    onChange={(e) => setCustomStatusFilter(e.target.value)}
                                                    placeholder="e.g. accepted"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VALIDATION SUMMARY */}
                    {validationSummary && (
                        <div className="bg-success-bg border border-success/30 p-4 rounded-[12px] text-sm space-y-2">
                            <p className="font-bold text-success flex items-center gap-2">
                                <FileCheck className="w-4 h-4" /> File parsed successfully
                            </p>
                            <ul className="list-disc list-inside text-success pl-1 space-y-1 text-xs">
                                <li><strong>{validationSummary.count}</strong> valid reservations found</li>
                                <li>Date range: {validationSummary.dateRange}</li>
                                <li>Properties: {validationSummary.properties.join(', ')} {validationSummary.properties.length > 3 && '...'}</li>
                            </ul>
                            {validationSummary.cancelled > 0 && (
                                <p className="text-warning text-xs flex items-center gap-1 mt-2">
                                    <AlertCircle className="w-3 h-3" /> {validationSummary.cancelled} cancelled reservations excluded
                                </p>
                            )}
                        </div>
                    )}

                    {/* DATE & GENERATE */}
                    <div className="space-y-4 max-w-md mx-auto pt-4 border-t border-moss/10">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-tobacco uppercase tracking-wide ml-1">Comparison Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-3 bg-bone-light border border-bone-dark rounded-[12px] focus:outline-none focus:ring-2 focus:ring-cedar/30 text-onyx font-sans"
                            />
                        </div>

                        <button
                            disabled={isProcessing || (pms === 'hostaway' ? (!hostawayFiles.prev || !hostawayFiles.curr) : (!singleFile))}
                            className={cn(
                                "w-full py-4 bg-cedar text-bone font-bold tracking-widest rounded-full hover:bg-onyx transition-colors shadow-[0_1px_3px_rgba(22,25,16,0.06)] active:scale-95 duration-200 flex items-center justify-center gap-2",
                                (isProcessing || (pms === 'hostaway' ? (!hostawayFiles.prev || !hostawayFiles.curr) : (!singleFile))) && "opacity-70 cursor-not-allowed"
                            )}
                            onClick={handleGenerate}
                        >
                            {isProcessing ? "PROCESSING..." : (
                                <>
                                    GENERATE DASHBOARD <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
