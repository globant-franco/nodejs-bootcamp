// type is 'success' or 'error'
export const showAlert = (type, message, time = 5) => {
  hideAlert();
  const div = document.createElement('div');
  div.className = `alert alert--${type}`;
  div.appendChild(document.createTextNode(message));
  document.querySelector('body').insertAdjacentElement('afterbegin', div);

  setTimeout(() => {
    hideAlert();
  }, time * 1000);
};

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  // tricky way to remove queried element
  if (el) el.parentElement.removeChild(el);
};
