import React, { useState, useEffect, useRef } from 'react';
import TurnstileWidget from './TurnstileWidget';
import styles from './ContactForm.module.css';

interface FormFields {
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
  _hp: string; // Honeypot field
}

export type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const ContactForm: React.FC = () => {
  const [fields, setFields] = useState<FormFields>({
    name: '',
    phone: '',
    email: '',
    company: '',
    message: '',
    _hp: '',
  });

  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Unique submission ID generated on mount to ensure idempotency across retries
  const submissionIdRef = useRef<string>('');
  useEffect(() => {
    submissionIdRef.current = crypto.randomUUID();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete copy[name];
        return copy;
      });
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setServerError(null);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setServerError('SECURITY CHALLENGE RUNTIME ERROR. PLEASE TRY AGAIN.');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fields.name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!fields.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!/^[0-9+\s-]{8,20}$/.test(fields.phone.trim())) {
      errors.phone = 'Invalid phone number format. Must be 8 to 20 digits.';
    }
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errors.email = 'Invalid email address format.';
    }
    if (!fields.message.trim()) {
      errors.message = 'Message content is required.';
    }
    if (!consent) {
      errors.consent = 'You must grant consent to process your business data.';
    }
    if (!turnstileToken) {
      errors.security = 'Security verification challenge is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* eslint-disable-next-line @typescript-eslint/no-deprecated */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setFormState('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fields,
          submissionId: submissionIdRef.current,
          turnstileToken,
          consentCaptured: consent,
        }),
      });

      const result = await response.json() as {
        success: boolean;
        category?: string;
        message?: string;
        errors?: Record<string, string>;
      };

      if (response.ok && result.success) {
        setFormState('success');
        // Clear fields on success
        setFields({ name: '', phone: '', email: '', company: '', message: '', _hp: '' });
        setConsent(false);
        // Generate new submission ID for next inquiry
        submissionIdRef.current = crypto.randomUUID();
      } else {
        setFormState('error');
        if (result.errors) {
          setFieldErrors(result.errors);
        } else {
          setServerError(result.message || 'UNEXPECTED OPERATION REGRESSION. SUBMISSION ABORTED.');
        }
      }
    } catch (err) {
      console.error('[ContactForm] Submission failed:', err);
      setFormState('error');
      setServerError('COMMUNICATION PIPELINE TIMEOUT. VERIFY INTERNET CONNECTION.');
    }
  };

  return (
    <form className={styles.form} onSubmit={(e) => { void handleSubmit(e); }} noValidate>
      {/* Honeypot field (hidden from visual/keyboard accessibility) */}
      <input
        type="text"
        name="_hp"
        value={fields._hp}
        onChange={handleInputChange}
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <h2 className={styles.formTitle}>INQUIRY TRANSMISSION DESK</h2>

      {/* Global alert boxes */}
      {formState === 'success' && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          MESSAGE PERSISTED SECURELY. TECHNICAL COORDINATORS WILL CONFLICT CONTACT PROCEDURES DIRECTLY.
        </div>
      )}

      {formState === 'error' && serverError && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {serverError}
        </div>
      )}

      {/* Name Input */}
      <div className={styles.inputGroup}>
        <label htmlFor="contact-name" className={styles.label}>
          FULL NAME <span className={styles.required}>*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          value={fields.name}
          onChange={handleInputChange}
          className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
          disabled={formState === 'submitting'}
          maxLength={100}
        />
        {fieldErrors.name && (
          <span id="contact-name-error" className={styles.errorText}>
            {fieldErrors.name}
          </span>
        )}
      </div>

      {/* Phone Input */}
      <div className={styles.inputGroup}>
        <label htmlFor="contact-phone" className={styles.label}>
          PHONE NUMBER <span className={styles.required}>*</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          name="phone"
          value={fields.phone}
          onChange={handleInputChange}
          className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
          aria-invalid={!!fieldErrors.phone}
          aria-describedby={fieldErrors.phone ? 'contact-phone-error' : undefined}
          disabled={formState === 'submitting'}
          maxLength={30}
        />
        {fieldErrors.phone && (
          <span id="contact-phone-error" className={styles.errorText}>
            {fieldErrors.phone}
          </span>
        )}
      </div>

      {/* Email Input */}
      <div className={styles.inputGroup}>
        <label htmlFor="contact-email" className={styles.label}>
          EMAIL ADDRESS (OPTIONAL)
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          value={fields.email}
          onChange={handleInputChange}
          className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
          disabled={formState === 'submitting'}
          maxLength={254}
        />
        {fieldErrors.email && (
          <span id="contact-email-error" className={styles.errorText}>
            {fieldErrors.email}
          </span>
        )}
      </div>

      {/* Company Input */}
      <div className={styles.inputGroup}>
        <label htmlFor="contact-company" className={styles.label}>
          COMPANY / PROJECT NAME (OPTIONAL)
        </label>
        <input
          id="contact-company"
          type="text"
          name="company"
          value={fields.company}
          onChange={handleInputChange}
          className={styles.input}
          disabled={formState === 'submitting'}
          maxLength={150}
        />
      </div>

      {/* Message Textarea */}
      <div className={styles.inputGroup}>
        <label htmlFor="contact-message" className={styles.label}>
          DETAILED INQUIRY MESSAGE <span className={styles.required}>*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={fields.message}
          onChange={handleInputChange}
          className={`${styles.textarea} ${fieldErrors.message ? styles.inputError : ''}`}
          aria-invalid={!!fieldErrors.message}
          aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
          disabled={formState === 'submitting'}
          maxLength={3000}
        />
        {fieldErrors.message && (
          <span id="contact-message-error" className={styles.errorText}>
            {fieldErrors.message}
          </span>
        )}
      </div>

      {/* Consent capture checkbox (DPDP Compliance requirement) */}
      <div className={styles.checkboxGroup}>
        <input
          id="contact-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => { setConsent(e.target.checked); }}
          className={styles.checkbox}
          disabled={formState === 'submitting'}
        />
        <label htmlFor="contact-consent" className={styles.checkboxLabel}>
          I explicitly consent to the collection and storage of my personal contact information for communication and shipping coordination, in accordance with the <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.privacyLink}>Privacy Policy</a>. <span className={styles.required}>*</span>
        </label>
        {fieldErrors.consent && (
          <span className={styles.errorText}>{fieldErrors.consent}</span>
        )}
      </div>

      {/* Turnstile verification widget */}
      <div className={styles.turnstileRow}>
        <TurnstileWidget
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          onError={handleTurnstileError}
        />
        {fieldErrors.security && (
          <span className={styles.errorText}>{fieldErrors.security}</span>
        )}
      </div>

      {/* Submit action */}
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={formState === 'submitting'}
      >
        {formState === 'submitting' ? 'TRANSMITTING...' : 'TRANSMIT SECURE INQUIRY'}
      </button>
    </form>
  );
};

export default ContactForm;
