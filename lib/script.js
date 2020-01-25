const hideForOneSec = function() {
  const wateringCan = document.querySelector('#wateringCan');
  wateringCan.style.visibility = 'hidden';
  setTimeout(() => (wateringCan.style.visibility = 'visible'), 1000);
};
