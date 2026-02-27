"use client";

import { useState } from 'react';
import { UploadScreen } from '@/app/components/UploadScreen';
import { Dashboard } from '@/app/components/Dashboard';
import { AuthGuard } from '@/app/components/AuthGuard';
import type { Reservation } from '@/types';

export default function DashboardPage() {
    const [view, setView] = useState<'upload' | 'dashboard'>('upload');
    const [rawData, setRawData] = useState<Reservation[]>([]);
    const [comparisonDate, setComparisonDate] = useState<Date>(new Date());

    const handleDataReady = (data: Reservation[], date: Date) => {
        setRawData(data);
        setComparisonDate(date);
        setView('dashboard');
    };

    const handleBack = () => {
        setRawData([]);
        setView('upload');
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-bone">
                {view === 'upload' ? (
                    <UploadScreen onDataReady={handleDataReady} />
                ) : (
                    <Dashboard
                        rawData={rawData}
                        comparisonDate={comparisonDate}
                        onBack={handleBack}
                    />
                )}
            </div>
        </AuthGuard>
    );
}
