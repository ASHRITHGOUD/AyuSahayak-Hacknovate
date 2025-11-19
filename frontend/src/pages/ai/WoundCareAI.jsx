import React, { useEffect, useState } from 'react';
import NurseNav from '../../components/NurseNav';
import http from '../../api/http';
import AIImageAnalysis from '../../components/AIImageAnalysis';
import { useNavigate } from 'react-router-dom';

export default function WoundCareAI() {
  const ref = new URLSearchParams(window.location.search).get('ref') || '';
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientImage = async () => {
      try {
        const res = await http.get(`/patients/${ref}`);
        const photos = res.data?.photos || [];
        if (photos.length > 0) setImageUrl(photos[0].url);
        else alert('No image found for this patient.');
      } catch (err) {
        console.error('Error fetching patient image:', err);
        if (err.response?.status === 401) {
          alert('Session expired. Please log in again.');
          window.location.href = '/login';
        } else {
          alert('Failed to fetch patient data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (ref) fetchPatientImage();
  }, [ref]);

  return (
    <>
      <style>{`
        .ai-page {
          min-height: 100vh;
          background: hsl(210 20% 98%);
        }
        .ai-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 24px;
          margin-top: 50px;
          animation: fadeInUp 0.5s ease-out;
        }
        .ai-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .ai-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: hsl(215 25% 27%);
          margin-bottom: 8px;
        }
        .ai-header p {
          color: hsl(215 16% 47%);
          font-size: 16px;
          margin: 0;
        }
        .back-btn {
          background: linear-gradient(135deg, hsl(4 90% 58%) 0%, hsl(4 90% 52%) 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .back-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px hsla(4 90% 58% / 0.3);
        }
        .ai-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 8px -2px rgba(0,0,0,0.08);
          padding: 32px;
          border-left: 4px solid hsl(4 90% 58%);
        }

        /* ⭐ IMAGE FIX — Center + Good Clarity */
        .ai-image-wrapper {
          text-align: center;
          margin-bottom: 30px;
        }
        .ai-image {
          max-width: 480px;
          width: 100%;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          object-fit: cover;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ai-page">
        <NurseNav />

        <div className="ai-container">
          <div className="ai-header">
            <div>
              <h1>🩹 WoundCare AI Analysis</h1>
              <p>Assess wound stage and generate AI-based recommendations</p>
            </div>
            <button className="back-btn" onClick={() => navigate('/nurse/patients')}>
              ← Back to Patients
            </button>
          </div>

          <div className="ai-card">
            {loading && (
              <p style={{ textAlign: 'center', color: 'gray' }}>Loading image...</p>
            )}

            {imageUrl ? (
              <>
                {/* ⭐ IMAGE CENTERED */}
                <div className="ai-image-wrapper">
                  <img src={imageUrl} alt="Patient Wound" className="ai-image" />
                </div>

                {/* AI Image Processing */}
                <AIImageAnalysis
                  conditionType="wound"
                  imageUrl={imageUrl}
                  patientRef={ref}
                />
              </>
            ) : (
              !loading && (
                <p style={{ textAlign: 'center', color: 'hsl(215 16% 47%)' }}>
                  ⚠ No image available for this patient.
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
