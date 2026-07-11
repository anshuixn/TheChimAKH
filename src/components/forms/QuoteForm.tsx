import React, { useState, useEffect, useRef } from 'react';
import TurnstileWidget from './TurnstileWidget';
import styles from './QuoteForm.module.css';

interface QuoteFields {
  name: string;
  phone: string;
  email: string;
  company: string;
  projectLocation: string;
  estimatedQty: string;
  qtyUnit: string;
  requiredBy: string;
  message: string;
  brickVariant: string;
  _hp: string;
}

export type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const QuoteForm: React.FC = () => {
  const [fields, setFields] = useState<QuoteFields>({
    name: '',
    phone: '',
    email: '',
    company: '',
    projectLocation: '',
    estimatedQty: '',
    qtyUnit: 'pieces',
    requiredBy: '',
    message: '',
    brickVariant: 'traditional-red-clay',
    _hp: '',
  });

  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Unique submission ID generated on mount for idempotency safety
  const submissionIdRef = useRef<string>('');
  useEffect(() => {
    submissionIdRef.current = crypto.randomUUID();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
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
    if (!fields.projectLocation.trim()) {
      errors.projectLocation = 'Project delivery location coordinates are required.';
    }
    if (!fields.estimatedQty.trim()) {
      errors.estimatedQty = 'Estimated batch quantity is required.';
    } else {
      const num = parseFloat(fields.estimatedQty);
      if (isNaN(num) || num <= 0) {
        errors.estimatedQty = 'Quantity must be a positive number greater than 0.';
      }
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
      const response = await fetch('/api/quote', {
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
        setFields({
          name: '',
          phone: '',
          email: '',
          company: '',
          projectLocation: '',
          estimatedQty: '',
          qtyUnit: 'pieces',
          requiredBy: '',
          message: '',
          brickVariant: 'traditional-red-clay',
          _hp: '',
        });
        setConsent(false);
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
      console.error('[QuoteForm] Submission failed:', err);
      setFormState('error');
      setServerError('COMMUNICATION PIPELINE TIMEOUT. VERIFY INTERNET CONNECTION.');
    }
  };

  return (
    <form className={styles.form} onSubmit={(e) => { void handleSubmit(e); }} noValidate>
      {/* Honeypot field (hidden from screen reader / keyboard) */}
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

      <h2 className={styles.formTitle}>ESTIMATE CALCULATOR DESK</h2>

      {/* Global alert boxes */}
      {formState === 'success' && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          ESTIMATE DATA LOGGED SECURELY. DISPATCH SCHEDULERS WILL INITIATE CONTACT PROCEDURES DIRECTLY.
        </div>
      )}

      {formState === 'error' && serverError && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {serverError}
        </div>
      )}

      {/* Row 1: Name and Phone */}
      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <label htmlFor="quote-name" className={styles.label}>
            CONTACT NAME <span className={styles.required}>*</span>
          </label>
          <input
            id="quote-name"
            type="text"
            name="name"
            value={fields.name}
            onChange={handleInputChange}
            className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'quote-name-error' : undefined}
            disabled={formState === 'submitting'}
            maxLength={100}
          />
          {fieldErrors.name && (
            <span id="quote-name-error" className={styles.errorText}>
              {fieldErrors.name}
            </span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="quote-phone" className={styles.label}>
            MOBILE PHONE <span className={styles.required}>*</span>
          </label>
          <input
            id="quote-phone"
            type="tel"
            name="phone"
            value={fields.phone}
            onChange={handleInputChange}
            className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? 'quote-phone-error' : undefined}
            disabled={formState === 'submitting'}
            maxLength={30}
          />
          {fieldErrors.phone && (
            <span id="quote-phone-error" className={styles.errorText}>
              {fieldErrors.phone}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Email and Company */}
      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <label htmlFor="quote-email" className={styles.label}>
            EMAIL ADDRESS (OPTIONAL)
          </label>
          <input
            id="quote-email"
            type="email"
            name="email"
            value={fields.email}
            onChange={handleInputChange}
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'quote-email-error' : undefined}
            disabled={formState === 'submitting'}
            maxLength={254}
          />
          {fieldErrors.email && (
            <span id="quote-email-error" className={styles.errorText}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="quote-company" className={styles.label}>
            COMPANY / CONTRACTING AGENT (OPTIONAL)
          </label>
          <input
            id="quote-company"
            type="text"
            name="company"
            value={fields.company}
            onChange={handleInputChange}
            className={styles.input}
            disabled={formState === 'submitting'}
            maxLength={150}
          />
        </div>
      </div>

      {/* Row 3: Product variant selection */}
      <div className={styles.inputGroup}>
        <label htmlFor="quote-variant" className={styles.label}>
          RED BRICK CLASSIFICATION / GRADE
        </label>
        <select
          id="quote-variant"
          name="brickVariant"
          value={fields.brickVariant}
          onChange={handleInputChange}
          className={styles.select}
          disabled={formState === 'submitting'}
        >
          <option value="traditional-red-clay">Traditional Red Clay Brick (Class I)</option>
          <option value="traditional-red-clay-ii">Traditional Red Clay Brick (Class II)</option>
        </select>
      </div>

      {/* Row 4: Quantity & Unit */}
      <div className={styles.row}>
        <div className={styles.inputGroup} style={{ flex: 2 }}>
          <label htmlFor="quote-qty" className={styles.label}>
            ESTIMATED BATCH QUANTITY <span className={styles.required}>*</span>
          </label>
          <input
            id="quote-qty"
            type="number"
            name="estimatedQty"
            value={fields.estimatedQty}
            onChange={handleInputChange}
            className={`${styles.input} ${fieldErrors.estimatedQty ? styles.inputError : ''}`}
            aria-invalid={!!fieldErrors.estimatedQty}
            aria-describedby={fieldErrors.estimatedQty ? 'quote-qty-error' : undefined}
            disabled={formState === 'submitting'}
            min="1"
          />
          {fieldErrors.estimatedQty && (
            <span id="quote-qty-error" className={styles.errorText}>
              {fieldErrors.estimatedQty}
            </span>
          )}
        </div>

        <div className={styles.inputGroup} style={{ flex: 1 }}>
          <label htmlFor="quote-unit" className={styles.label}>
            UNIT OF MEASURE
          </label>
          <select
            id="quote-unit"
            name="qtyUnit"
            value={fields.qtyUnit}
            onChange={handleInputChange}
            className={styles.select}
            disabled={formState === 'submitting'}
          >
            <option value="pieces">Pieces (Bricks)</option>
            <option value="truckloads">Truckloads (~5,000 pcs)</option>
            <option value="pallets">Pallets (~500 pcs)</option>
          </select>
        </div>
      </div>

      {/* Row 5: Project Location & Delivery Date */}
      <div className={styles.row}>
        <div className={styles.inputGroup} style={{ flex: 2 }}>
          <label htmlFor="quote-location" className={styles.label}>
            PROJECT SITE DELIVERY COORDINATES / ADDRESS <span className={styles.required}>*</span>
          </label>
          <input
            id="quote-location"
            type="text"
            name="projectLocation"
            value={fields.projectLocation}
            onChange={handleInputChange}
            placeholder="E.g., City district name or full site address"
            className={`${styles.input} ${fieldErrors.projectLocation ? styles.inputError : ''}`}
            aria-invalid={!!fieldErrors.projectLocation}
            aria-describedby={fieldErrors.projectLocation ? 'quote-location-error' : undefined}
            disabled={formState === 'submitting'}
            maxLength={250}
          />
          {fieldErrors.projectLocation && (
            <span id="quote-location-error" className={styles.errorText}>
              {fieldErrors.projectLocation}
            </span>
          )}
        </div>

        <div className={styles.inputGroup} style={{ flex: 1 }}>
          <label htmlFor="quote-date" className={styles.label}>
            REQUIRED DATE (OPTIONAL)
          </label>
          <input
            id="quote-date"
            type="date"
            name="requiredBy"
            value={fields.requiredBy}
            onChange={handleInputChange}
            className={styles.input}
            disabled={formState === 'submitting'}
          />
        </div>
      </div>

      {/* Optional Message */}
      <div className={styles.inputGroup}>
        <label htmlFor="quote-message" className={styles.label}>
          ADDITIONAL REINFORCEMENT / BATCH LOGISTIC REQUIREMENTS (OPTIONAL)
        </label>
        <textarea
          id="quote-message"
          name="message"
          rows={3}
          value={fields.message}
          onChange={handleInputChange}
          className={styles.textarea}
          disabled={formState === 'submitting'}
          maxLength={3000}
        />
      </div>

      {/* DPDP Compliance consent capture */}
      <div className={styles.checkboxGroup}>
        <input
          id="quote-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => { setConsent(e.target.checked); }}
          className={styles.checkbox}
          disabled={formState === 'submitting'}
        />
        <label htmlFor="quote-consent" className={styles.checkboxLabel}>
          I explicitly consent to the collection and storage of my project logistics coordinates and phone number to coordinate structural brick dispatch schedules, in accordance with the <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.privacyLink}>Privacy Policy</a>. <span className={styles.required}>*</span>
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
        {formState === 'submitting' ? 'CALCULATING...' : 'TRANSMIT SECURE ESTIMATE REQUEST'}
      </button>
    </form>
  );
};

export default QuoteForm;
