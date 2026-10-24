const playground = document.querySelector('.playground-shell');

if (playground) {
  const studyWindow = playground.querySelector('.study-window');
  const status = playground.querySelector('#study-status');
  const defaults = { layout: 'wide', theme: 'light', accent: 'lavender' };
  const choices = {
    layout: ['wide', 'compact'],
    theme: ['light', 'dark'],
    accent: ['lavender', 'coral', 'lime'],
  };
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  function updateStudy() {
    const state = {};
    for (const [key, allowed] of Object.entries(choices)) {
      const input = playground.querySelector(`input[name="study-${key}"]:checked`);
      state[key] = allowed.includes(input?.value) ? input.value : defaults[key];
      studyWindow.dataset[key] = state[key];
    }
    status.textContent = `${capitalize(state.layout)} layout · ${capitalize(state.theme)} appearance · ${capitalize(state.accent)} accent`;
  }

  playground.addEventListener('change', (event) => {
    if (event.target.matches('input[type="radio"]')) updateStudy();
  });
  playground.querySelector('.study-reset').addEventListener('click', () => {
    for (const [key, value] of Object.entries(defaults)) {
      playground.querySelector(`input[name="study-${key}"][value="${value}"]`).checked = true;
    }
    updateStudy();
  });
  playground.querySelector('.playground-controls').hidden = false;
  updateStudy();
}
