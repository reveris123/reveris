(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.case-card')];
  const globalButton = document.querySelector('#motion-toggle');
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states = new Map();
  function setGlobalLabel() {
    globalButton.textContent = paused ? 'Play visible videos' : 'Pause all';
    globalButton.setAttribute('aria-pressed', String(paused));
  }
  function load(video) {
    if (video.dataset.src) {
      video.src = video.dataset.src;
      delete video.dataset.src;
      video.load();
    }
  }
  function pause(state) {
    state.videos.forEach(video => video.pause());
    state.button.textContent = 'Play pair';
    state.button.setAttribute('aria-pressed', 'false');
  }
  function play(state) {
    state.videos.forEach(video => {
      load(video);
      video.play().catch(() => {
        state.button.textContent = 'Play pair';
        state.button.setAttribute('aria-pressed', 'false');
      });
    });
    state.button.textContent = 'Pause pair';
    state.button.setAttribute('aria-pressed', 'true');
  }
  for (const card of cards) {
    const state = {videos:[...card.querySelectorAll('video')], button:card.querySelector('.pair-toggle'), visible:false, manualPause:false};
    states.set(card, state);
    for (const video of state.videos) {
      video.muted = true;
      video.addEventListener('error', () => {
        video.closest('figure').querySelector('.video-error').hidden = false;
      });
    }
    state.button.hidden = false;
    card.querySelector('.replay').hidden = false;
    state.button.addEventListener('click', () => {
      if (state.videos.some(video => !video.paused)) {
        state.manualPause = true;
        pause(state);
      } else {
        state.manualPause = false;
        play(state);
      }
    });
    card.querySelector('.replay').addEventListener('click', () => {
      state.manualPause = false;
      state.videos.forEach(video => {load(video); video.currentTime = 0;});
      play(state);
    });
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = states.get(entry.target);
      state.visible = entry.isIntersecting;
      if (state.visible && !paused && !state.manualPause && !document.hidden) play(state);
      else pause(state);
    }
  }, {threshold:0.15});
  cards.forEach(card => observer.observe(card));
  globalButton.addEventListener('click', () => {
    paused = !paused;
    setGlobalLabel();
    states.forEach(state => {
      if (paused) pause(state);
      else {state.manualPause = false; if (state.visible) play(state);}
    });
  });
  document.addEventListener('visibilitychange', () => {
    states.forEach(state => {
      if (document.hidden) pause(state);
      else if (state.visible && !paused && !state.manualPause) play(state);
    });
  });
  setGlobalLabel();
})();
