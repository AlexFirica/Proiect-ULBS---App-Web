document.addEventListener('DOMContentLoaded', async() =>{
    const saveduser = localStorage.getItem('user');
    if (!saveduser) {
    window.location.href = '/login.html';
    return;
  }
  const user=JSON.parse(saveduser);
  document.querySelector('.welcome-banner h2').textContent = `Bun venit, ${user.username}! 👋`;
  document.querySelector('.user-name').textContent = user.username;
  document.querySelector('.user-role').textContent = user.role;

})