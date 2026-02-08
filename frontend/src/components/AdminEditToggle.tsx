import React, { createContext, useContext, useState } from 'react';
import { isAdmin } from '../utils/auth';

interface AdminEditContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
}

const AdminEditContext = createContext<AdminEditContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
});

export const useAdminEdit = () => useContext(AdminEditContext);

export const AdminEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const admin = isAdmin();

  const toggleEditMode = () => {
    if (admin) {
      setIsEditMode(!isEditMode);
    }
  };

  const handleSave = () => {
    // Trigger a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('adminSaveChanges'));
    // Turn off edit mode after saving
    setTimeout(() => {
      setIsEditMode(false);
    }, 500); // Small delay to allow save to complete
  };

  return (
    <AdminEditContext.Provider value={{ isEditMode, toggleEditMode }}>
      {children}
    </AdminEditContext.Provider>
  );
};

export default AdminEditProvider;
