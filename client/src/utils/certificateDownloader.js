import QRCode from 'qrcode';

/**
 * Generates and downloads a high-resolution (1920x1200) verified Certificate of Achievement / Completion
 * as a PNG image directly into the user's Downloads folder.
 */
export async function downloadCertificateAsImage(certificate) {
  if (!certificate) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');

  const studentName = (certificate.studentId?.name || 'Student Participant').toUpperCase();
  const eventTitle = certificate.eventId?.title || 'Campus Event';
  const certType = certificate.certificateType || 'Completion';
  const certId = certificate.certificateId || 'CERT-2026-VERIFIED';

  const collegeName = certificate.studentId?.collegeName;
  const dept = certificate.studentId?.department;
  let institution = '';
  if (collegeName && dept) {
    institution = `${collegeName} — ${dept}`;
  } else if (collegeName) {
    institution = collegeName;
  } else if (dept) {
    institution = dept;
  } else {
    institution = 'Participant Scholar';
  }

  const dateStr = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // 1. Background Fill
  const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1200);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.5, '#fcfcfc');
  bgGrad.addColorStop(1, '#f8fafc');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1920, 1200);

  // 2. Elaborate Certificate Borders
  // Outer Navy Border
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, 1840, 1120);

  // Gold Secondary Border
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(58, 58, 1804, 1084);

  // Inner Thin Navy Hairline
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(68, 68, 1784, 1064);

  // Corner Accent Diamonds
  const drawCornerDiamond = (cx, cy) => {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx, cy + 12);
    ctx.lineTo(cx - 12, cy);
    ctx.closePath();
    ctx.fill();
  };
  drawCornerDiamond(58, 58);
  drawCornerDiamond(1862, 58);
  drawCornerDiamond(58, 1142);
  drawCornerDiamond(1862, 1142);

  // 3. Header Title & Brand Emblem
  ctx.textAlign = 'center';

  // Platform Tagline
  ctx.font = '700 20px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#2563eb';
  ctx.letterSpacing = '6px';
  ctx.fillText('EVENTBRIDGE • INTER-COLLEGE EVENT PLATFORM', 960, 140);
  ctx.letterSpacing = 'normal';

  // Decorative Subheader
  ctx.font = '600 15px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('OFFICIAL VERIFIED ACADEMIC & HACKATHON CREDENTIAL', 960, 175);

  // Divider Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(720, 205);
  ctx.lineTo(1200, 205);
  ctx.stroke();

  // 4. Main Certificate Title
  ctx.font = '800 58px "Segoe UI", Georgia, serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`CERTIFICATE OF ${certType.toUpperCase()}`, 960, 290);

  // Subtitle
  ctx.font = '500 22px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('THIS IS PROUDLY PRESENTED TO', 960, 360);

  // 5. Recipient Name
  ctx.font = '800 64px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(studentName, 960, 450);

  // Underline for recipient name
  const textWidth = ctx.measureText(studentName).width;
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(960 - textWidth / 2 - 20, 475);
  ctx.lineTo(960 + textWidth / 2 + 20, 475);
  ctx.stroke();

  // Institution / Department
  ctx.font = '600 26px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`of ${institution}`, 960, 525);

  // Citation text
  ctx.font = '400 23px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    `for successful participation, demonstrated excellence, and completion of all competitive rounds in`,
    960,
    590
  );

  // Event Title
  ctx.font = '800 36px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`"${eventTitle}"`, 960, 655);

  // 6. Bottom Section: Details, QR Code, and Official Seal/Signatures
  // Left: Date and Credential ID
  ctx.textAlign = 'left';
  ctx.font = '600 16px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('DATE OF ISSUANCE', 160, 930);
  ctx.font = '700 22px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(dateStr, 160, 965);

  ctx.font = '600 16px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('OFFICIAL CREDENTIAL ID', 160, 1020);
  ctx.font = '700 24px monospace';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(certId, 160, 1055);

  // Center: Scannable Verification QR Code
  try {
    const verifyUrl = `${window.location.origin}/verify/${certId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 170,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    const qrImg = new Image();
    await new Promise((resolve, reject) => {
      qrImg.onload = resolve;
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });

    // Draw QR Code centered at (960, 980)
    ctx.drawImage(qrImg, 960 - 85, 910, 170, 170);

    ctx.textAlign = 'center';
    ctx.font = '600 13px "Segoe UI", Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('SCAN TO VERIFY ONLINE', 960, 1105);
  } catch (err) {
    console.warn('QR Code drawing fallback:', err);
  }

  // Right: Official Signatures & Seal
  ctx.textAlign = 'right';

  // Signature line
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1440, 980);
  ctx.lineTo(1760, 980);
  ctx.stroke();

  // Signature script text
  ctx.font = 'italic 700 26px "Brush Script MT", "Segoe Script", cursive, Georgia';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText('Dr. Ramesh Sundaram', 1700, 960);

  ctx.font = '700 20px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Dean of Student Affairs', 1760, 1015);

  ctx.font = '500 15px "Segoe UI", Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Academic & Hackathon Council', 1760, 1045);

  // Trigger download as PNG
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `EventBridge_Certificate_${certId}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
