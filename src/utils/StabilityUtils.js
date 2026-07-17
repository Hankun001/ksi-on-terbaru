import React, { useState, useEffect } from 'react';

// Input Validation Utilities
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  // Password harus memiliki setidaknya 8 karakter, 1 huruf besar, 1 huruf kecil, dan 1 angka
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

// Form Validation Hook
const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateField = (fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return true;

    if (rule.required && (!value || value.trim() === '')) {
      return rule.errorMessage || `${fieldName} wajib diisi.`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.errorMessage || `Format ${fieldName} tidak valid.`;
    }

    if (rule.minLength && value.length < rule.minLength) {
      return rule.errorMessage || `${fieldName} harus memiliki setidaknya ${rule.minLength} karakter.`;
    }

    return true; // Valid
  };

  const validateForm = () => {
    const newErrors = {};
    let formIsValid = true;

    for (const fieldName in validationRules) {
      const result = validateField(fieldName, values[fieldName]);
      if (result !== true) {
        newErrors[fieldName] = result;
        formIsValid = false;
      }
    }

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setIsValid(false);
  };

  return {
    values,
    errors,
    isValid,
    handleChange,
    validateForm,
    resetForm
  };
};

// Error Handling Utilities
const handleApiError = (error, customMessage = "Terjadi kesalahan") => {
  console.error(customMessage, error);
  return error.message || customMessage;
};

// Performance Monitoring
const measurePerformance = (fn, name) => {
  const start = performance.now();
  return fn().finally(() => {
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  });
};

// Debounce Utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized Components
const MemoizedComponent = React.memo(({ children, ...props }) => {
  return <div {...props}>{children}</div>;
});

// Accessibility Utilities
const useFocusTrap = (ref) => {
  useEffect(() => {
    if (!ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
};

// Cleanup Functions
const cleanupResources = (resources) => {
  resources.forEach(resource => {
    if (resource && typeof resource.unsubscribe === 'function') {
      resource.unsubscribe();
    }
  });
};

// Export all utilities
export {
  validateEmail,
  validatePassword,
  useFormValidation,
  handleApiError,
  measurePerformance,
  useDebounce,
  MemoizedComponent,
  useFocusTrap,
  cleanupResources
};
