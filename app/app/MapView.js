'use client';
import { useEffect, useRef } from 'react';

// OpenStreetMap map with one dot per permit. Permits in the same municipality are fanned out
// around its centre, because each permit's exact address is inside its document.
export default function MapView({ points, selected, onSelect }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const L = useRef(null);
  const fitted = useRef(false);
  const pts = useRef(points);
  pts.current = points;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = (await import('leaflet')).default;
      if (cancelled || map.current) return;
      L.current = leaflet;
      map.current = leaflet.map(box.current, { zoomControl: true, attributionControl: true }).setView([38.3, 23.8], 6);
      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; συντελεστές OpenStreetMap',
        })
        .addTo(map.current);
      layer.current = leaflet.layerGroup().addTo(map.current);
      draw();
    })();
    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, selected]);

  function draw() {
    const leaflet = L.current;
    if (!leaflet || !layer.current) return;
    layer.current.clearLayers();
    const css = getComputedStyle(document.documentElement);
    const color = (v) => css.getPropertyValue(v).trim();
    const count = {};
    const bounds = [];
    for (const p of pts.current) {
      const n = (count[p.code] = (count[p.code] || 0) + 1) - 1;
      const ang = n * 2.4;
      const rad = n ? 0.004 * Math.sqrt(n) : 0;
      const lat = p.lat + Math.sin(ang) * rad;
      const lon = p.lon + Math.cos(ang) * rad * 1.3;
      bounds.push([lat, lon]);
      const isSel = p.ada === selected;
      const m = leaflet.circleMarker([lat, lon], {
        radius: isSel ? 10 : 7,
        color: isSel ? color('--ink') : p.hl ? color('--warn') : color('--panel'),
        weight: isSel || p.hl ? 3 : 2,
        fillColor: p.stage === 'pre' ? color('--pre') : color('--ok'),
        fillOpacity: p.dim ? 0.2 : 0.95,
        opacity: p.dim ? 0.3 : 1,
      });
      m.bindTooltip(`${p.title} · ${p.place}`);
      m.on('click', () => onSelect(p.ada));
      m.addTo(layer.current);
    }
    if (!fitted.current && bounds.length) {
      map.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      fitted.current = true;
    }
  }

  // Centre on the selected permit when it changes from the list.
  useEffect(() => {
    if (!map.current || !selected) return;
    const p = points.find((x) => x.ada === selected);
    if (p && !map.current.getBounds().contains([p.lat, p.lon])) map.current.panTo([p.lat, p.lon]);
  }, [selected, points]);

  return <div ref={box} style={{ width: '100%', height: '100%', minHeight: 420 }} role="region" aria-label="Χάρτης αδειών" />;
}
