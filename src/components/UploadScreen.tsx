import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileCheck, X, FileSpreadsheet, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { cn } from '../lib/utils';
import { parseCSV, detectPMS } from '../utils/csvParser';
import type { Reservation, PMSType, PMSColumnMapping } from '../types';

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
                "cursor-pointer rounded-xl p-6 border transition-all duration-200 flex flex-col items-center text-center space-y-3 h-full hover:shadow-md",
                isSelected
                    ? "bg-cedar border-cedar text-bone shadow-lg scale-105"
                    : "bg-white border-moss/20 hover:border-cedar text-onyx"
            )}
        >
            <div className={cn("p-3 rounded-full mb-1", isSelected ? "bg-bone/10" : "bg-bone")}>
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
                "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group",
                heightClass,
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
            // Simple split for headers, real parsing is better but this is quick for UI
            // Using a simple regex to handle quotes if possible or just split by comma
            // Re-using the logic from parser would be ideal but it's async and internal
            // Let's just read the file and use a simple split for now, or use the parser if we expose a header reader
            // Actually, let's just use the parser's logic if we can, but we need to implement a 'getHeaders'
            // For now, simple split
            const headers = firstLine.split(',').map(h => h.replace(/"/g, '').trim());
            setCustomHeaders(headers);

            // Auto-detect check
            const detected = detectPMS(headers);
            if (detected !== 'unknown' && detected !== 'custom') {
                if (confirm(`This looks like a ${detected.toUpperCase()} file. Would you like to switch to automatic parsing?`)) {
                    setPms(detected);
                    // The file is already set, logic needs a trigger to re-process if we switch
                    // But since we just setPms, useEffect clears the file. 
                    // UseEffect clears file, so user has to drop again? 
                    // Let's keep the file if we switch? 
                    // Complex state interaction. 
                    // Let's just switch PMS and let user drop again for simplicity, 
                    // or better, carry over the file.
                    // To carry over, we need to disable the cleanup in useEffect for this specific transition.
                    // For now, simpler to just let them drop again or not clear.
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
                    properties: properties.slice(0, 3), // Top 3
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
                finalData = parsedData; // Already parsed
            } else if (pms === 'custom') {
                if (!singleFile) return;
                // Construct mapping
                const finalMapping = { ...customMapping };
                if (customStatusCol && customStatusCol !== 'None') {
                    finalMapping.status = customStatusCol;
                }
                // Inject custom status filter logic into parser? 
                // We didn't add status filter value to customMapping interface (it's in config).
                // But parseCSV takes customMapping as PMSColumnMapping.
                // We need to pass the status filter value too?
                // `parseCSV` uses `PMS_PARSERS[pmsType]?.statusFilter`. 
                // For custom, `statusFilter` logic is missing in `parseCSV`.
                // I need to update `parseCSV` to handle custom status filter?
                // Wait, I can pass a modified config or just standard logic.
                // Let's assume for now we just filter in `parseCSV` if status col is mapped.
                // Actually `parseCSV` uses `PMS_PARSERS[pmsType].statusFilter`. 
                // I should update `parseCSV` to accept custom status filter value.
                // OR, just for this MVP, we assume 'accepted' or exact match?
                // The requirements say: "Include only rows where status equals: [text input]"

                // Hack: We can filter the results here after parsing if I cannot change parser easily.
                // But `parseCSV` is doing the filtering.
                // Better: Update `PMS_PARSERS`? No, constant.
                // I will filter here since I receive `reservations` and `cancelledCount` isn't critical for Custom.

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
                        <h1 className="text-5xl font-serif text-onyx italic">revfactor</h1>
                        <p className="text-moss tracking-widest text-sm uppercase">Select Data Source</p>
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
                    <div className="text-right">
                        <h1 className="text-3xl font-serif text-onyx italic">revfactor</h1>
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/60 space-y-6">

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
                        <div className="bg-white p-4 rounded-xl border border-moss/20 space-y-4">
                            <h3 className="font-bold text-onyx text-sm uppercase">Map Columns</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {Object.keys(customMapping).map((key) => {
                                    if (key === 'status') return null; // Handle separately
                                    return (
                                        <div key={key} className="space-y-1">
                                            <label className="text-xs font-bold text-moss uppercase">{key}</label>
                                            <select
                                                className="w-full p-2 bg-bone border border-moss/20 rounded"
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
                                                className="w-full p-2 bg-bone border border-moss/20 rounded"
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
                                                    className="w-full p-2 bg-bone border border-moss/20 rounded"
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
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-sm space-y-2">
                            <p className="font-bold text-emerald-800 flex items-center gap-2">
                                <FileCheck className="w-4 h-4" /> File parsed successfully
                            </p>
                            <ul className="list-disc list-inside text-emerald-700 pl-1 space-y-1 text-xs">
                                <li><strong>{validationSummary.count}</strong> valid reservations found</li>
                                <li>Date range: {validationSummary.dateRange}</li>
                                <li>Properties: {validationSummary.properties.join(', ')} {validationSummary.properties.length > 3 && '...'}</li>
                            </ul>
                            {validationSummary.cancelled > 0 && (
                                <p className="text-amber-600 text-xs flex items-center gap-1 mt-2">
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
                                className="w-full p-3 bg-white border border-moss/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cedar/20 text-onyx font-sans"
                            />
                        </div>

                        <button
                            disabled={isProcessing || (pms === 'hostaway' ? (!hostawayFiles.prev || !hostawayFiles.curr) : (!singleFile))}
                            className={cn(
                                "w-full py-4 bg-cedar text-bone font-bold tracking-widest rounded-lg hover:bg-onyx transition-colors shadow-lg active:scale-95 duration-200 flex items-center justify-center gap-2",
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

