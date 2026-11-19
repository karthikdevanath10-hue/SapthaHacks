import React from 'react';
import { WatchSplitDashboard } from './WatchSplitDashboard';
import { MediaModality } from '../types';

interface DashboardViewProps {
  onOpenInvestigation: (id: string) => void;
  onNewInvestigation: (modality?: MediaModality) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenInvestigation,
  onNewInvestigation
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="pb-2">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Forensic Operations & Watch Workspace</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select any forensic app from the left watch dial to inspect evidence, audit logs, and data storage on the right
        </p>
      </div>

      <WatchSplitDashboard
        onOpenInvestigation={onOpenInvestigation}
        onNewInvestigation={(mod) => onNewInvestigation(mod)}
        initialApp="audit_logs"
        isOverlay={false}
      />
    </div>
  );
};
