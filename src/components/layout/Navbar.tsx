import React from 'react';
import { TopHeader } from './TopHeader';

export interface NavbarProps {
  currentTab: string;
  setCurrentTab?: (tab: string) => void;
  onOpenNotifications: () => void;
  onOpenSidebar?: () => void;
  onPostJob?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenNotifications,
  onOpenSidebar = () => {},
  onPostJob,
}) => {
  return (
    <TopHeader
      currentTab={currentTab}
      onOpenSidebar={onOpenSidebar}
      onOpenNotifications={onOpenNotifications}
      onPostJob={onPostJob}
    />
  );
};
