window.onload = function () {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

  const login = async (email, password) => {
    try {
      const res = await axios({
        method: 'post',
        url: 'http://localhost:3000/api/v1/users/login',
        data: {
          email: email,
          password: password,
        },
      });
      console.log('response is', res);
    } catch (err) {
      console.log('error logging in:', err.response.data);
      //console.log(err.response.data.message);
    }
  };
};
