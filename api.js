const $ = id => document.getElementById(id);
async function api(acao, dados = {}) {
  const senha = localStorage.getItem('senha') || '';
  const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao, senha, ...dados }) });
  const j = await r.json();
  if (j.auth === false && acao !== 'login' && senha) { localStorage.removeItem('senha'); location.reload(); }
  return j;
}
function sair() { localStorage.removeItem('senha'); localStorage.removeItem('perfil'); location.reload(); }
function exigirLogin(aceitos, cb) {
  const ov = document.createElement('div'); ov.id = 'login';
  ov.innerHTML = '<div class="box"><h2>Entrar</h2><input id="pw" type="password" placeholder="Senha" autocomplete="current-password"><button id="go">ENTRAR</button><p id="lerr"></p></div>';
  document.body.appendChild(ov);
  const entrar = p => { ov.remove(); cb(p); };
  async function tenta() {
    $('lerr').textContent = '';
    try {
      const r = await api('login');
      if (!r.ok) return $('lerr').textContent = r.msg;
      if (!aceitos.includes(r.perfil)) return $('lerr').textContent = 'Esta senha não vale para este app.';
      localStorage.setItem('perfil', r.perfil); entrar(r.perfil);
    } catch (e) {
      if (localStorage.getItem('senha') && aceitos.includes(localStorage.getItem('perfil'))) entrar(localStorage.getItem('perfil'));
      else $('lerr').textContent = 'Sem conexão.';
    }
  }
  $('go').onclick = () => { localStorage.setItem('senha', $('pw').value); tenta(); };
  if (localStorage.getItem('senha')) tenta();
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
