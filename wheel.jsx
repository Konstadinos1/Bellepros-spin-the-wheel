import React, { useState, useRef, useEffect, useCallback } from 'react';

const SEGMENTS = [
  { label: 'Boisson\nGratuite', prob: 0.25, value: 3, color: '#1a6b3c', desc: 'Une boisson au choix offerte!' },
  { label: 'Dessert\nGratuit', prob: 0.20, value: 5, color: '#b8860b', desc: 'Un dessert maison offert!' },
  { label: '10$ Rabais', prob: 0.20, value: 10, color: '#2e4a8a', desc: '10$ de rabais sur ta prochaine visite!' },
  { label: 'Poutine\nGratuite', prob: 0.15, value: 12, color: '#8b1a1a', desc: 'Une poutine loaded offerte!' },
  { label: '25$ en\nBouffe', prob: 0.10, value: 25, color: '#6b2fa0', desc: '25$ de bouffe gratuite! GROS GAIN!' },
  { label: 'Upgrade\nCombo', prob: 0.05, value: 4, color: '#0a7a7a', desc: 'Upgrade ton combo au max!' },
  { label: '50$\nJACKPOT', prob: 0.05, value: 50, color: '#c41e3a', desc: '🎉 JACKPOT 50$! T\'ES UN CHAMPION! 🎉' },
  { label: 'Boisson\nGratuite', prob: 0.00, value: 3, color: '#2d5a1e', desc: 'Une boisson au choix offerte!' },
];

const TOTAL_SEGMENTS = SEGMENTS.length;
const ARC = (2 * Math.PI) / TOTAL_SEGMENTS;

function weightedRandom() {
  const filtered = SEGMENTS.map((s, i) => ({ ...s, index: i })).filter((_, i) => i < 7);
  const r = Math.random();
  let cum = 0;
  for (const s of filtered) {
    cum += s.prob;
    if (r <= cum) return s.index;
  }
  return 0;
}

export default function RoueDeFortune() {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('idle');
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [bulbFrame, setBulbFrame] = useState(0);
  const [confettiParts, setConfettiParts] = useState([]);
  const audioCtxRef = useRef(null);
  const lastTickRef = useRef(-1);
  const animRef = useRef(null);
  const bulbRef = useRef(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playTick = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1800 + Math.random() * 400;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }, [getAudioCtx]);

  const playWinJingle = useCallback((isBig) => {
    try {
      const ctx = getAudioCtx();
      const notes = isBig ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isBig ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.35);
      });
    } catch (e) {}
  }, [getAudioCtx]);

  const spawnConfetti = useCallback(() => {
    const parts = [];
    for (let i = 0; i < 120; i++) {
      parts.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 4,
        color: ['#FFD700', '#FF6B35', '#E63946', '#fff', '#6b2fa0', '#0a7a7a'][Math.floor(Math.random() * 6)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
      });
    }
    setConfettiParts(parts);
  }, []);

  // Bulb animation
  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setBulbFrame(frame);
    }, 350);
    bulbRef.current = id;
    return () => clearInterval(id);
  }, []);

  // Confetti animation
  useEffect(() => {
    if (confettiParts.length === 0) return;
    const id = setInterval(() => {
      setConfettiParts(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          rot: p.rot + p.vr,
        })).filter(p => p.y < window.innerHeight + 50);
        if (next.length === 0) return [];
        return next;
      });
    }, 30);
    return () => clearInterval(id);
  }, [confettiParts.length > 0]);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 30;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    const glowGrad = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + 25);
    glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
    glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, size, size);

    // Carnival bulbs
    const bulbCount = 20;
    for (let i = 0; i < bulbCount; i++) {
      const angle = (i / bulbCount) * Math.PI * 2 - Math.PI / 2;
      const bx = cx + Math.cos(angle) * (radius + 14);
      const by = cy + Math.sin(angle) * (radius + 14);
      const isOn = (i + bulbFrame) % 3 !== 0;
      const bulbColor = i % 2 === 0 ? '#FFD700' : '#FF6B35';

      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      if (isOn) {
        ctx.fillStyle = bulbColor;
        ctx.shadowColor = bulbColor;
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = 'rgba(80,80,80,0.5)';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Segments
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const startAngle = rotation + i * ARC - Math.PI / 2;
      const endAngle = startAngle + ARC;
      const seg = SEGMENTS[i];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius);
      grad.addColorStop(0, lightenColor(seg.color, 30));
      grad.addColorStop(0.5, seg.color);
      grad.addColorStop(1, darkenColor(seg.color, 30));
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,215,0,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      const textAngle = startAngle + ARC / 2;
      ctx.translate(cx, cy);
      ctx.rotate(textAngle);
      const lines = seg.label.split('\n');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      lines.forEach((line, li) => {
        const lineY = (li - (lines.length - 1) / 2) * 16;
        ctx.fillText(line, radius * 0.62, lineY);
      });
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Center hub
    const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 42);
    hubGrad.addColorStop(0, '#FFD700');
    hubGrad.addColorStop(0.6, '#b8860b');
    hubGrad.addColorStop(1, '#8b6914');
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#1B1B2F';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BELLE', cx, cy - 8);
    ctx.fillText('PROS', cx, cy + 8);

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 6);
    ctx.lineTo(cx - 16, cy - radius - 36);
    ctx.lineTo(cx + 16, cy - radius - 36);
    ctx.closePath();
    ctx.fillStyle = '#E63946';
    ctx.shadowColor = '#E63946';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [rotation, bulbFrame]);

  const spin = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('spinning');
    setWinner(null);
    setConfettiParts([]);

    const TWO_PI = 2 * Math.PI;
    const targetIndex = weightedRandom();
    // Whole revolutions only — a fractional count would shift the landing angle.
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    const segmentAngle = targetIndex * ARC;
    const withinSegment = Math.random() * ARC * 0.6 + ARC * 0.2;
    // Aim relative to the wheel's current offset so the pointer lands on
    // the announced segment even after previous spins shifted the wheel.
    const startRot = rotation;
    const currentOffset = ((startRot % TWO_PI) + TWO_PI) % TWO_PI;
    const targetOffset = TWO_PI - segmentAngle - withinSegment;
    const totalDelta = fullRotations * TWO_PI + ((targetOffset - currentOffset + TWO_PI) % TWO_PI);
    const duration = 4500 + Math.random() * 1500;
    const startTime = performance.now();
    lastTickRef.current = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const currentRot = startRot + totalDelta * ease;
      setRotation(currentRot);

      // Tick sound
      const normalizedAngle = ((currentRot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentSeg = Math.floor(normalizedAngle / ARC) % TOTAL_SEGMENTS;
      if (currentSeg !== lastTickRef.current) {
        lastTickRef.current = currentSeg;
        playTick();
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('reveal');
        const seg = SEGMENTS[targetIndex];
        setWinner(seg);
        const isBig = seg.value >= 25 || seg.label.includes('Upgrade');
        playWinJingle(isBig);
        if (isBig) {
          setTimeout(() => spawnConfetti(), 200);
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [phase, rotation, playTick, playWinJingle, spawnConfetti]);

  const reset = useCallback(() => {
    setPhase('idle');
    setWinner(null);
    setConfettiParts([]);
  }, []);

  function lightenColor(hex, pct) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + pct);
    const g = Math.min(255, ((num >> 8) & 0xff) + pct);
    const b = Math.min(255, (num & 0xff) + pct);
    return `rgb(${r},${g},${b})`;
  }

  function darkenColor(hex, pct) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - pct);
    const g = Math.max(0, ((num >> 8) & 0xff) - pct);
    const b = Math.max(0, (num & 0xff) - pct);
    return `rgb(${r},${g},${b})`;
  }

  const canvasSize = 420;

  return (
    <div style={styles.container}>
      {/* Confetti overlay */}
      {confettiParts.length > 0 && (
        <div style={styles.confettiLayer}>
          {confettiParts.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                transform: `rotate(${p.rot}deg)`,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}

      <h1 style={styles.title}>LA ROUE DE FORTUNE</h1>
      <p style={styles.subtitle}>Dépense 50$+ = 1 Spin Gratuit!</p>

      <div style={styles.wheelContainer}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ width: canvasSize, height: canvasSize }}
        />
      </div>

      {phase === 'idle' && (
        <button onClick={spin} style={styles.spinBtn}>
          <span style={styles.spinBtnText}>TOURNER!</span>
        </button>
      )}

      {phase === 'spinning' && (
        <div style={styles.spinningText}>La roue tourne...</div>
      )}

      {phase === 'reveal' && winner && (
        <div style={styles.resultCard}>
          <div style={styles.resultEmoji}>{winner.value >= 25 ? '🎉' : '🎊'}</div>
          <div style={styles.resultTitle}>FÉLICITATIONS!</div>
          <div style={styles.resultPrize}>{winner.label.replace('\n', ' ')}</div>
          <div style={styles.resultDesc}>{winner.desc}</div>
          <button onClick={reset} style={styles.resetBtn}>
            Prochain Joueur →
          </button>
        </div>
      )}

      <div style={styles.prizeTable}>
        <div style={styles.prizeTableTitle}>Tableau des Prix</div>
        <div style={styles.prizeGrid}>
          {SEGMENTS.slice(0, 7).map((s, i) => (
            <div key={i} style={styles.prizeRow}>
              <span style={styles.prizeName}>{s.label.replace('\n', ' ')}</span>
              <span style={styles.prizeProb}>{Math.round(s.prob * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        Seulement au Bellepros 440 · Laval
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(230,57,70,0.5), 0 0 40px rgba(230,57,70,0.2); }
          50% { box-shadow: 0 0 30px rgba(230,57,70,0.8), 0 0 60px rgba(230,57,70,0.4); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1B1B2F 50%, #0a0a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 10px',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  confettiLayer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  title: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    margin: '0 0 4px 0',
    textAlign: 'center',
    textShadow: '0 0 20px rgba(255,215,0,0.5)',
    letterSpacing: 3,
  },
  subtitle: {
    color: '#FF6B35',
    fontSize: 16,
    margin: '0 0 16px 0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  wheelContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  spinBtn: {
    background: 'linear-gradient(135deg, #E63946, #c41e3a)',
    border: 'none',
    borderRadius: 50,
    padding: '16px 60px',
    cursor: 'pointer',
    animation: 'pulseGlow 1.5s infinite, pulse 2s infinite',
    marginBottom: 16,
  },
  spinBtnText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 4,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  spinningText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    animation: 'pulse 0.5s infinite',
  },
  resultCard: {
    background: 'linear-gradient(135deg, rgba(27,27,47,0.95), rgba(10,10,26,0.95))',
    border: '2px solid #FFD700',
    borderRadius: 16,
    padding: '20px 30px',
    textAlign: 'center',
    marginBottom: 16,
    animation: 'fadeInUp 0.5s ease-out',
    maxWidth: 360,
  },
  resultEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  resultTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 2,
  },
  resultPrize: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultDesc: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 16,
  },
  resetBtn: {
    background: 'linear-gradient(135deg, #FF6B35, #e55a2b)',
    border: 'none',
    borderRadius: 30,
    padding: '12px 36px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: 1,
  },
  prizeTable: {
    background: 'rgba(27,27,47,0.7)',
    border: '1px solid rgba(255,215,0,0.2)',
    borderRadius: 12,
    padding: '12px 20px',
    marginBottom: 12,
    maxWidth: 360,
    width: '100%',
  },
  prizeTableTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  prizeGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  prizeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 8px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.03)',
  },
  prizeName: {
    color: '#ccc',
    fontSize: 12,
  },
  prizeProb: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
};
