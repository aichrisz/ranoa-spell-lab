(function (root) {
  "use strict";
  function create(canvas) {
    const ctx = canvas.getContext("2d");
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(2, root.devicePixelRatio || 1);
      const width = Math.round(rect.width * ratio),
        height = Math.round(rect.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    function point(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((clientX - r.left) * 900) / r.width,
        y: ((clientY - r.top) * 560) / r.height,
      };
    }
    function ring(x, y, r, color, width = 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    function draw(s, aim, decorative) {
      resize();
      ctx.setTransform(canvas.width / 900, 0, 0, canvas.height / 560, 0, 0);
      ctx.fillStyle = "#081f2c";
      ctx.fillRect(0, 0, 900, 560);
      const gradient = ctx.createRadialGradient(450, 280, 20, 450, 280, 450);
      gradient.addColorStop(0, "#17414c");
      gradient.addColorStop(1, "#071c29");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 900, 560);
      // Fixed world geometry means rendering and input share the same aspect ratio.
      for (let r = 70; r <= 330; r += 65) ring(450, 280, r, "#285563", 0.8);
      ctx.strokeStyle = "#214451";
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        ctx.beginPath();
        ctx.moveTo(450 + Math.cos(a) * 70, 280 + Math.sin(a) * 70);
        ctx.lineTo(450 + Math.cos(a) * 330, 280 + Math.sin(a) * 330);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(450, 280);
      if (decorative) ctx.rotate(s.elapsed * 0.025);
      ctx.strokeStyle = "#4a6969";
      ctx.setLineDash([2, 13]);
      ring(0, 0, 213, "#587878");
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.strokeRect(235, -5, 10, 10);
      }
      ctx.restore();
      ctx.strokeStyle = "#395a62";
      ctx.strokeRect(20, 20, 860, 520);
      for (const t of s.targets) {
        const frozen = t.slow > 0,
          color = frozen ? "#d0d6ff" : "#83edf0";
        if (decorative) {
          ring(
            t.x,
            t.y + 10,
            t.radius + 10 + Math.sin(s.elapsed * 2 + t.id) * 4,
            "#316775",
          );
        }
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.shadowColor = color;
        ctx.shadowBlur = decorative ? 15 : 0;
        ctx.fillStyle = frozen ? "#354565" : "#194955";
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3 - Math.PI / 2;
          const x = Math.cos(a) * t.radius,
            y = Math.sin(a) * t.radius;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ring(0, 0, t.radius - 9, frozen ? "#a9baf1" : "#3d94a0");
        ctx.fillStyle = "#e8ffff";
        ctx.font = "19px Georgia";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(frozen ? "❄" : String(t.id).padStart(2, "0"), 0, 0);
        if (frozen) {
          ctx.font = "10px system-ui";
          ctx.fillText(t.slow.toFixed(1) + "s", 0, t.radius + 17);
        }
        ctx.restore();
      }
      for (const e of s.effects) {
        const p = 1 - e.life / e.duration,
          radius = e.kind === "burst" ? 100 : e.kind === "frost" ? 140 : 38;
        ctx.globalAlpha = 1 - p;
        const color = e.hit
          ? e.kind === "frost"
            ? "#d5dbff"
            : "#9cffff"
          : "#e3b27d";
        ring(e.x, e.y, radius * (decorative ? p : 0.8) + 8, color, 3);
        if (e.kind === "bolt") {
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(e.x - 30, e.y + 50);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();
        }
        if (decorative)
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            ring(
              e.x + Math.cos(a) * radius * p,
              e.y + Math.sin(a) * radius * p,
              2,
              color,
              2,
            );
          }
        ctx.globalAlpha = 1;
      }
      if (s.phase === "running") {
        const radius =
          s.selected === "burst" ? 100 : s.selected === "frost" ? 140 : 17;
        ring(aim.x, aim.y, radius, "#dfbf8090");
        ring(aim.x, aim.y, 5, "#f0d6a0", 2);
        ctx.strokeStyle = "#f0d6a0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(aim.x - 24, aim.y);
        ctx.lineTo(aim.x - 12, aim.y);
        ctx.moveTo(aim.x + 12, aim.y);
        ctx.lineTo(aim.x + 24, aim.y);
        ctx.moveTo(aim.x, aim.y - 24);
        ctx.lineTo(aim.x, aim.y - 12);
        ctx.moveTo(aim.x, aim.y + 12);
        ctx.lineTo(aim.x, aim.y + 24);
        ctx.stroke();
      }
    }
    return { draw, point };
  }
  (root.Ranoa = root.Ranoa || {}).Renderer = Object.freeze({ create });
})(globalThis);
