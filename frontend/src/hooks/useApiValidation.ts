import { useState, useEffect } from 'react';
import { ApiItem } from '../types/api';
import { validateResponse } from '../utils/responseValidation';

interface ExpectedValue {
  key: string;
  value: string;
  id: string;
}

export const useApiValidation = (selectedItem: ApiItem | null) => {
  const [validationEnabled, setValidationEnabled] = useState(false);
  const [expectedValuesList, setExpectedValuesList] = useState<ExpectedValue[]>([
    { key: '', value: '', id: '1' }
  ]);
  const [lastValidationResult, setLastValidationResult] = useState<any>(null);

  // selectedItem이 변경될 때 validation 데이터 로드
  useEffect(() => {
    if (!selectedItem) return;

    setValidationEnabled(selectedItem.validationEnabled || false);
    
    let savedExpectedValues = [];
    try {
      if (selectedItem.expectedValues) {
        if (typeof selectedItem.expectedValues === 'string') {
          savedExpectedValues = JSON.parse(selectedItem.expectedValues);
        } else if (Array.isArray(selectedItem.expectedValues)) {
          savedExpectedValues = selectedItem.expectedValues;
        }
      }
    } catch (e) {
      console.warn('Failed to parse expectedValues:', e);
      savedExpectedValues = [];
    }

    if (savedExpectedValues.length > 0) {
      setExpectedValuesList(savedExpectedValues.map((item: any, index: number) => ({
        key: item.key || '',
        value: item.value || '',
        id: (index + 1).toString()
      })));
    } else {
      setExpectedValuesList([{ key: '', value: '', id: '1' }]);
    }
  }, [selectedItem]);

  const addExpectedValue = () => {
    const newId = Math.max(...expectedValuesList.map(ev => parseInt(ev.id))) + 1;
    setExpectedValuesList([...expectedValuesList, { key: '', value: '', id: newId.toString() }]);
  };

  const removeExpectedValue = (index: number) => {
    if (expectedValuesList.length > 1) {
      setExpectedValuesList(expectedValuesList.filter((_, i) => i !== index));
    }
  };

  const updateExpectedValue = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...expectedValuesList];
    updated[index][field] = value;
    setExpectedValuesList(updated);
  };

  const performValidation = (responseData: any) => {
    if (!validationEnabled || expectedValuesList.length === 0) {
      setLastValidationResult(null);
      return;
    }

    try {
      const filteredExpectedValues = expectedValuesList.filter(ev => ev.key.trim() && ev.value.trim());
      if (filteredExpectedValues.length > 0) {
        const validationResult = validateResponse(responseData, filteredExpectedValues);
        setLastValidationResult(validationResult);
        return validationResult;
      }
    } catch (error) {
      console.error('Validation error:', error);
      setLastValidationResult({
        passed: false,
        results: [{
          key: 'validation',
          expectedValue: 'N/A',
          actualValue: 'N/A',
          passed: false,
          error: error instanceof Error ? error.message : 'Validation error'
        }]
      });
    }
  };

  const resetValidation = () => {
    setLastValidationResult(null);
  };

  return {
    validationEnabled,
    setValidationEnabled,
    expectedValuesList,
    setExpectedValuesList,
    lastValidationResult,
    addExpectedValue,
    removeExpectedValue,
    updateExpectedValue,
    performValidation,
    resetValidation
  };
};