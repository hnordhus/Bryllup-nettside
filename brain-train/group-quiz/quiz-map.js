"use strict";

const ChristmasQuizMap = (() => {
  function countryName(id) {
    const country = ChristmasQuizMapData.find(item => item[0] === id);
    return country ? country[2] : `Unknown map selection (${id})`;
  }
  function markup() {
    const paths = ChristmasQuizMapData.map(([id, path]) =>
      `<path data-country="${id}" d="${path}" fill-rule="evenodd" tabindex="0" role="button" aria-label="Select this country"></path>`).join("");
    return `<div class="quiz-map-wrap">
      <svg id="quiz-map" viewBox="0 0 360 180" role="group" aria-label="World map">
        <rect width="360" height="180" class="map-ocean"></rect>${paths}
      </svg>
      <div class="map-controls"><button type="button" data-map-zoom="in" aria-label="Zoom in">+</button>
        <button type="button" data-map-zoom="out" aria-label="Zoom out">−</button>
        <button type="button" data-map-zoom="reset" aria-label="Reset map">↺</button></div>
      <p class="muted map-hint">Drag to move · pinch or use + / − to zoom · tap a country to select it.</p>
      <p id="map-selection" class="muted" role="status">No country selected.</p>
      <button class="btn" type="button" id="confirm-map" disabled>Confirm country</button>
    </div>`;
  }
  function bind(container, onAnswer) {
    const svg = container.querySelector("#quiz-map");
    const confirmButton = container.querySelector("#confirm-map");
    const points = new Map();
    let view = [0, 0, 360, 180], pan = null, pinch = null, selected = null;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const update = () => svg.setAttribute("viewBox", view.join(" "));
    const zoom = (factor, origin = null) => {
      const width = clamp(view[2] * factor, 15, 360);
      const height = width / 2;
      const x = origin ? origin[0] : view[0] + view[2] / 2;
      const y = origin ? origin[1] : view[1] + view[3] / 2;
      const fx = (x - view[0]) / view[2], fy = (y - view[1]) / view[3];
      view = [clamp(x - fx * width, 0, 360 - width), clamp(y - fy * height, 0, 180 - height), width, height];
      update();
    };
    const select = country => {
      if (!country) return;
      svg.querySelectorAll(".map-selected").forEach(el => el.classList.remove("map-selected"));
      selected = country.dataset.country;
      svg.querySelectorAll("[data-country]").forEach(el => {
        if (el.dataset.country === selected) el.classList.add("map-selected");
      });
      container.querySelector("#map-selection").textContent = "Country selected. Confirm when ready.";
      confirmButton.disabled = false;
    };
    svg.addEventListener("pointerdown", event => {
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      svg.setPointerCapture(event.pointerId);
      if (points.size === 1) pan = { x: event.clientX, y: event.clientY, view: view.slice(), moved: false };
      if (points.size === 2) {
        const [a, b] = [...points.values()];
        pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), width: view[2] };
        pan = null;
      }
    });
    svg.addEventListener("pointermove", event => {
      if (!points.has(event.pointerId)) return;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const rect = svg.getBoundingClientRect();
      if (pinch && points.size >= 2) {
        const [a, b] = [...points.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 0) zoom(pinch.width * pinch.distance / distance / view[2]);
      } else if (pan) {
        const dx = event.clientX - pan.x, dy = event.clientY - pan.y;
        if (Math.hypot(dx, dy) > 6) pan.moved = true;
        const scale = Math.min(rect.width / pan.view[2], rect.height / pan.view[3]);
        view = [clamp(pan.view[0] - dx / scale, 0, 360 - pan.view[2]),
          clamp(pan.view[1] - dy / scale, 0, 180 - pan.view[3]), pan.view[2], pan.view[3]];
        update();
      }
    });
    svg.addEventListener("pointerup", event => {
      points.delete(event.pointerId);
      if (pinch) { if (points.size < 2) { pinch = null; pan = null; } return; }
      if (pan && points.size === 0) {
        if (!pan.moved) {
          const hit = document.elementFromPoint(event.clientX, event.clientY);
          select(hit && hit.closest("[data-country]"));
        }
        pan = null;
      }
    });
    svg.addEventListener("pointercancel", () => { points.clear(); pan = null; pinch = null; });
    svg.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-country]")) {
        event.preventDefault(); select(event.target);
      }
    });
    container.querySelectorAll("[data-map-zoom]").forEach(button => button.addEventListener("click", () => {
      if (button.dataset.mapZoom === "reset") { view = [0, 0, 360, 180]; update(); }
      else zoom(button.dataset.mapZoom === "in" ? 0.65 : 1 / 0.65);
    }));
    confirmButton.addEventListener("click", () => { if (selected) onAnswer(selected); });
  }
  return { markup, bind, countryName };
})();
