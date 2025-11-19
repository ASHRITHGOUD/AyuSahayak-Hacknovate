import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import http from '../../api/http';

export default function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        // Ensure Jitsi script
        if (!window.JitsiMeetExternalAPI) {
          await new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = 'https://meet.jit.si/external_api.js';
            s.async = true;
            s.onload = resolve;
            document.body.appendChild(s);
          });
        }

        // Resolve room
        const { data } = await http.get(`/consultations/video-room/${encodeURIComponent(ref)}`);
        const room = data.video?.room || `consult-${data.consultationId || ref}`;

        setLoading(false);

        const domain = 'meet.jit.si';
        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName: room,
          width: '100%',
          height: 600,
          parentNode: document.getElementById('jitsi-container'),
          interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ['microphone','camera','tileview','hangup'] },
          configOverwrite: { disableDeepLinking: true }
        });
        api.addEventListener('readyToClose', () => navigate(-1));
      } catch (e) {
        setError('Failed to load video room');
        setLoading(false);
      }
    }
    init();
  }, [ref, navigate]);

  return (
    <div className="video-call-page">
      <style>{`
        .video-call-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: hsl(215 25% 27%);
          display: flex;
          flex-direction: column;
        }
        .video-header {
          padding: 16px 24px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .video-title {
          font-size: 18px;
          font-weight: 600;
          color: hsl(215 25% 27%);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-exit {
          padding: 10px 20px;
          background: hsl(4 90% 96%);
          color: hsl(4 90% 50%);
          border: 1px solid hsl(4 90% 86%);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-exit:hover {
          background: hsl(4 90% 50%);
          color: white;
        }
        .video-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        #jitsi-container {
          width: 100%;
          max-width: 1400px;
          height: 600px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .loading-state, .error-state {
          text-align: center;
          color: white;
        }
        .loading-icon {
          font-size: 64px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          #jitsi-container {
            height: 400px;
          }
        }
      `}</style>
      
      <div className="video-header">
        <div className="video-title">
          <span>📹</span>
          AyuSahayak Video Consultation
        </div>
        <button className="btn-exit" onClick={()=>navigate(-1)}>
          ✕ Exit
        </button>
      </div>

      <div className="video-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-icon">⏳</div>
            <h2>Connecting to video call...</h2>
            <p>Please wait while we set up your consultation</p>
          </div>
        )}
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Unable to connect</h2>
            <p>{error}</p>
          </div>
        )}
        <div id="jitsi-container" style={{display: loading || error ? 'none' : 'block'}} />
      </div>
    </div>
  );
}

