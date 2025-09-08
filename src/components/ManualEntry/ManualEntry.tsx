import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import type { ManualTrip } from '../../types/travel';

interface ManualEntryProps {
  onAddTrip: (trip: ManualTrip) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export const ManualEntry: React.FC<ManualEntryProps> = ({
  onAddTrip,
  onClose,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ManualTrip>({
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<ManualTrip>>({});
  const [showEndDate, setShowEndDate] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ManualTrip> = {};

    // Required field validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (!isValid(parseISO(formData.startDate))) {
      newErrors.startDate = 'Invalid date format';
    }

    // End date validation (if provided)
    if (formData.endDate) {
      if (!isValid(parseISO(formData.endDate))) {
        newErrors.endDate = 'Invalid date format';
      } else {
        const startDate = parseISO(formData.startDate);
        const endDate = parseISO(formData.endDate);
        if (endDate < startDate) {
          newErrors.endDate = 'End date must be after start date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
};