import React from 'react';
import { WatchSplitDashboard, WatchAppId } from './WatchSplitDashboard';
import { MediaModality } from '../types';

interface SlidingDashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInvestigation: (id: string) => void;
  onNewInvestigation: (modality?: MediaModality) => void;
  onNavigateToFullDashboard?: () => void;
  selectedModality?: MediaModality;
  onSelectModality?: (modality: MediaModality) => void;
}

export const SlidingDashboardDrawer: React.FC<SlidingDashboardDrawerProps> = ({
  isOpen,
  onClose,
  onOpenInvestigation,
  onNewInvestigation,
  selectedModality = 'image'
}) => {
  if (!isOpen) return null;

  return (
    <WatchSplitDashboard
      isOpen={isOpen}
      isOverlay={true}
      onClose={onClose}
      onOpenInvestigation={onOpenInvestigation}
      onNewInvestigation={(mod) => onNewInvestigation(mod)}
      initialApp={(selectedModality || 'image') as WatchAppId}
    />
  );
};
