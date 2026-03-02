"use client";

import { useState } from 'react';
import { UploadScreen } from '@/app/components/UploadScreen';
import { Dashboard } from '@/app/components/Dashboard';
import { AuthGuard } from '@/app/components/AuthGuard';
import { Navbar } from '@/app/components/Navbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { RevenueTracker } from '@/app/components/modules/RevenueTracker';
import { PMSConnector } from '@/app/components/modules/PMSConnector';
import { MiniCourse } from '@/app/components/modules/MiniCourse';
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
                <Tabs defaultValue="pacing">
                    <Navbar>
                        <TabsList>
                            <TabsTrigger value="pacing">Pacing Tool</TabsTrigger>
                            <TabsTrigger value="revenue">Revenue Tracker</TabsTrigger>
                            <TabsTrigger value="api">PMS Connector</TabsTrigger>
                            <TabsTrigger value="course">Mini Course</TabsTrigger>
                        </TabsList>
                    </Navbar>

                    <TabsContent value="pacing">
                        {view === 'upload' ? (
                            <UploadScreen onDataReady={handleDataReady} />
                        ) : (
                            <Dashboard
                                rawData={rawData}
                                comparisonDate={comparisonDate}
                                onBack={handleBack}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="revenue">
                        <RevenueTracker />
                    </TabsContent>

                    <TabsContent value="api">
                        <PMSConnector />
                    </TabsContent>

                    <TabsContent value="course">
                        <MiniCourse />
                    </TabsContent>
                </Tabs>
            </div>
        </AuthGuard>
    );
}
