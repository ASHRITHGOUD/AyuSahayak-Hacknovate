// utils/email/templates/consultationCompleted.js
function esc(s) { return String(s || '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

module.exports = function buildConsultationCompletedEmail(data) {
  const {
    consultationId,
    completedAt,
    patientName,
    doctorName,
    doctorQualification,
    doctorRegNo,
    doctorSignatureUrl,
    nurseName,
    hospitalName,
    hospitalAddress,
    paymentAmount,
    paymentDate,
    medications,
    notes
  } = data;

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '';
  const medRows = (medications || []).map((m, i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${esc(m.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${esc(m.dosage)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${esc(m.frequency)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${esc(m.duration)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${esc(m.instructions || '')}</td>
    </tr>`).join('') || `
    <tr><td colspan="5" style="padding:10px;color:#666;">No medicines prescribed.</td></tr>`;

  const signatureBlock = doctorSignatureUrl ? `
    <div style="margin-top:6px">
      <img src="${esc(doctorSignatureUrl)}" alt="Doctor Signature" style="height:48px"/>
    </div>` : '';

  return `
  <div style="font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;padding:24px;">
    <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #eaeaea;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
      <div style="padding:20px 24px;border-bottom:1px solid #f0f0f0;background:linear-gradient(90deg,#fefefe,#fafafa)">
        <div style="font-size:18px;font-weight:600;color:#111">${esc(hospitalName)}</div>
        <div style="font-size:12px;color:#555;margin-top:2px">${esc(hospitalAddress)}</div>
      </div>

      <div style="padding:20px 24px">
        <div style="font-size:16px;font-weight:600;color:#111;margin-bottom:6px">Consultation Completed</div>
        <div style="font-size:13px;color:#444">Consultation ID: <span style="font-weight:600">${esc(consultationId)}</span></div>
        <div style="font-size:13px;color:#444;margin-top:2px">Completed: ${esc(fmtDate(completedAt))}</div>

        <div style="margin-top:16px;padding:12px;background:#fbfbfd;border:1px solid #eee;border-radius:8px">
          <div style="font-size:14px;color:#111"><span style="font-weight:600">Patient:</span> ${esc(patientName)}</div>
          <div style="font-size:14px;color:#111;margin-top:4px"><span style="font-weight:600">Doctor:</span> ${esc(doctorName)}${doctorQualification ? `, ${esc(doctorQualification)}` : ''}${doctorRegNo ? ` (Reg: ${esc(doctorRegNo)})` : ''}</div>
          <div style="font-size:14px;color:#111;margin-top:4px"><span style="font-weight:600">Nurse:</span> ${esc(nurseName)}</div>
          ${signatureBlock}
        </div>

        <div style="margin-top:18px">
          <div style="font-size:15px;font-weight:600;color:#111;margin-bottom:8px">Prescription</div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#fafafa">
                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#333">Medicine</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#333">Dosage</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#333">Frequency</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#333">Duration</th>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#333">Instructions</th>
              </tr>
            </thead>
            <tbody>${medRows}</tbody>
          </table>
          ${notes ? `<div style="margin-top:10px;font-size:13px;color:#333"><span style="font-weight:600">Notes:</span> ${esc(notes)}</div>` : ''}
        </div>

        <div style="margin-top:18px">
          <div style="font-size:15px;font-weight:600;color:#111;margin-bottom:6px">Payment Details</div>
          <div style="font-size:14px;color:#111">Consultation Fee : ${paymentAmount != null ? `₹${paymentAmount}` : '—'}</div>
          <div style="font-size:13px;color:#555;margin-top:2px">Paid on: ${esc(fmtDate(paymentDate)) || '—'}</div>
        </div>

        <div style="margin-top:20px;font-size:12px;color:#666;border-top:1px solid #f0f0f0;padding-top:12px">
          This is an automated summary from AyuSahayak. For queries, contact your hospital.
        </div>
      </div>
    </div>
  </div>`;
};
