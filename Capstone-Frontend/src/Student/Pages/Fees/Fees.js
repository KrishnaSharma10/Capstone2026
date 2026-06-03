import React, { useContext, useEffect, useState } from 'react';
import StudentSidebar from '../../Components/Sidebar';
import './Fees.css';
import axios from 'axios';
import { UserContext } from '../../../UserContext';
import { toast } from 'react-toastify';
import UpiCode from './upiQR.png';
import EazyPay from './eazyPay.jpg';

const StudentFees = () => {
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [courseDetails, setCourseDetails] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const { student } = useContext(UserContext);

  useEffect(() => {
    if (student) {
      if (student.ongoing_application) {
        axios
          .post('http://127.0.0.1:5000/api/get-application-details', {
            application_id: student.ongoing_application,
          })
          .then((res) => {
            setApplicationDetails(res.data['Application Data']);
            setCourseDetails(res.data['Application Data']['opted_courses']);
          })
          .catch((err) => console.log(err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [student]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus('File size exceeds 2MB. Please upload a smaller PDF.');
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
    setUploadStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) { setUploadStatus('Please select a PDF file.'); return; }
    if (!applicationDetails?.application_id) { setUploadStatus('Application ID not loaded.'); return; }

    const formData = new FormData();
    formData.append('applicationID', applicationDetails.application_id);
    formData.append('pdf', pdfFile);
    toast.success('Please wait while receipt uploads!!');

    try {
      const token = localStorage.getItem('ICMPTokenStudent');
      const response = await axios.post(
        'http://127.0.0.1:5000/api/student/upload-fee',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUploadedUrl(response.data.url);
      setUploadStatus('Receipt uploaded successfully!');
      setApplicationDetails({ ...applicationDetails, fee_receipt_link: response.data.url });
      toast.success('Receipt uploaded successfully!!');
    } catch (err) {
      console.error(err);
      setUploadStatus('Failed to upload receipt.');
    }
  };

  const totalFees = courseDetails.length * 8000;

  /* ── Shared header ─────────────────────────────────────────────── */
  const PageHeader = () => (
    <>
      <p className="fees-eyebrow">Financial Services</p>
      <h1 className="fees-title">Fees Payment</h1>
      <p className="fees-subtitle">
        Review your course fee breakdown and complete payment for your ongoing
        improvement course application.
      </p>
    </>
  );

  /* ── Fee breakdown card ────────────────────────────────────────── */
  const BreakdownCard = () => (
    <div className="fees-card">
      <p className="fees-card__label">Application ID</p>
      <p className="fees-card__app-id">#{applicationDetails?.application_id || '—'}</p>

      <p className="fees-card__label" style={{ marginTop: '20px' }}>Fee Breakdown</p>
      <div className="fees-table">
        <div className="fees-table__row fees-table__row--header">
          <span>Course</span>
          <span>Amount</span>
        </div>
        {courseDetails.map((val, ind) => (
          <div key={ind} className="fees-table__row">
            <span>{ind + 1}. {val[0]}</span>
            <span>₹ 8,000</span>
          </div>
        ))}
        <div className="fees-table__row fees-table__row--total">
          <span>Total</span>
          <span>₹ {totalFees.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );

  /* ── Stage renderers ───────────────────────────────────────────── */

  // Stage 1 or 2 — pending approval
  const StagePending = () => (
    <>
      <BreakdownCard />
      <div className="fees-info-banner fees-info-banner--waiting">
        <span className="fees-info-banner__icon">⏳</span>
        <div>
          <p className="fees-info-banner__heading">Awaiting Approval</p>
          <p className="fees-info-banner__text">
            Payment options and receipt upload will be available after your
            application is approved by the Coordinator / DoAA.
          </p>
        </div>
      </div>
    </>
  );

  // Stage 3 — pay now
  const StagePayNow = () => (
    <>
      <BreakdownCard />

      {/* Amount due */}
      <div className="fees-amount-due">
        <span className="fees-amount-due__label">Amount Due</span>
        <span className="fees-amount-due__value">₹ {totalFees.toLocaleString('en-IN')}</span>
      </div>

      {/* Payment methods */}
      <div className="fees-card">
        <p className="fees-card__label">Payment Options</p>
        <div className="fees-payment-methods">
          <div className="fees-payment-method">
            <p className="fees-payment-method__title">Scan UPI QR Code</p>
            <div className="fees-qr-wrap">
              <img src={UpiCode} alt="UPI QR Code" className="fees-qr-img" />
            </div>
          </div>

          <div className="fees-payment-divider" />

          <div className="fees-payment-method">
            <p className="fees-payment-method__title">Pay via EazyPay</p>
            <div className="fees-qr-wrap">
              <img src={EazyPay} alt="EazyPay" className="fees-qr-img" />
            </div>
            <a
              href="https://eazypay.icicibank.com/homePage"
              target="_blank"
              rel="noopener noreferrer"
              className="fees-link-btn"
            >
              Open EazyPay →
            </a>
          </div>
        </div>
      </div>

      {/* Upload receipt */}
      <div className="fees-card">
        <p className="fees-card__label">Upload Fee Receipt</p>
        <p className="fees-upload__hint">PDF format only · Max size 2 MB</p>

        <form onSubmit={handleSubmit} className="fees-upload-form">
          <label className="fees-file-label">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="fees-file-input"
            />
            <span className="fees-file-label__text">
              {pdfFile ? pdfFile.name : 'Choose PDF file…'}
            </span>
          </label>
          <button type="submit" className="fees-submit-btn">
            Upload Receipt
          </button>
        </form>

        {uploadStatus && (
          <p className={`fees-upload-status ${uploadStatus.includes('success') ? 'fees-upload-status--ok' : 'fees-upload-status--err'}`}>
            {uploadStatus}
          </p>
        )}
        {uploadedUrl && (
          <p className="fees-uploaded-url">
            View receipt:{' '}
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
              {uploadedUrl}
            </a>
          </p>
        )}
      </div>
    </>
  );

  // Stage 4 — receipt uploaded, awaiting verification
  const StageUploaded = () => (
    <>
      <BreakdownCard />
      <div className="fees-info-banner fees-info-banner--success">
        <span className="fees-info-banner__icon">✅</span>
        <div>
          <p className="fees-info-banner__heading">Receipt Uploaded — ₹ {totalFees.toLocaleString('en-IN')}</p>
          <p className="fees-info-banner__text">
            Your payment receipt has been submitted. Please wait while the
            Coordinator verifies your payment before final acceptance.
          </p>
        </div>
      </div>
    </>
  );

  // No application
  const NoApplication = () => (
    <div className="fees-empty">
      <span className="fees-empty__icon">📋</span>
      <p className="fees-empty__text">No ongoing application found.</p>
    </div>
  );

  /* ── Main render ───────────────────────────────────────────────── */
  const renderContent = () => {
    if (loading) return <div className="fees-empty"><p>Loading…</p></div>;
    if (!applicationDetails) return <NoApplication />;

    switch (applicationDetails.stage) {
      case 1:
      case 2: return <StagePending />;
      case 3: return <StagePayNow />;
      case 4: return <StageUploaded />;
      default: return <NoApplication />;
    }
  };

  return (
    <div className="fees-page">
      <StudentSidebar />
      <div className="fees-main">
        <PageHeader />
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentFees;