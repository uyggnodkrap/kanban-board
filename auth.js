// ── Supabase 설정 ─────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zezbzjttxfmjzdzmmhte.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplemJ6anR0eGZtanpkem1taHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkwNzAsImV4cCI6MjA5NzI5NTA3MH0.LbyWm-UIu0IqkXBUG8hrQI25xpEB7f_UN-y1bDX8Nnc';
// ─────────────────────────────────────────────────────────────────────────────

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

// ── 뷰 전환 헬퍼 ──────────────────────────────────────────────────────────────
const AUTH_VIEWS = ['view-signin', 'view-signup', 'view-verify'];

function showView(id) {
  AUTH_VIEWS.forEach((v) => {
    document.getElementById(v).classList.toggle('hidden', v !== id);
  });
}

function showBoard(email) {
  document.getElementById('auth-panel').classList.add('hidden');
  document.getElementById('board-wrapper').classList.remove('hidden');
  document.getElementById('user-email').textContent = email ?? '';
}

function showAuth() {
  document.getElementById('board-wrapper').classList.add('hidden');
  document.getElementById('auth-panel').classList.remove('hidden');
  showView('view-signin');
}

// ── 인증 상태 변화 감지 (핵심 로직) ──────────────────────────────────────────
let kanbanInitialized = false;

supabaseClient.auth.onAuthStateChange((event, session) => {
  if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
    showBoard(session.user.email);
    if (!kanbanInitialized) {
      window.initBoard?.();
      kanbanInitialized = true;
    }
  } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
    showAuth();
    kanbanInitialized = false;
  }
});

// ── 로그인 폼 ─────────────────────────────────────────────────────────────────
document.getElementById('form-signin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('signin-error');
  errorEl.textContent = '';

  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = error.message;
  }
});

// ── 회원가입 폼 ───────────────────────────────────────────────────────────────
document.getElementById('form-signup').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('signup-error');
  errorEl.textContent = '';

  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });

  if (error) {
    errorEl.textContent = error.message;
  } else {
    showView('view-verify');
  }
});

// ── 화면 전환 버튼 ────────────────────────────────────────────────────────────
document.getElementById('btn-go-signup').addEventListener('click', () => showView('view-signup'));
document.getElementById('btn-go-signin').addEventListener('click', () => showView('view-signin'));
document.getElementById('btn-back-signin').addEventListener('click', () => showView('view-signin'));

// ── GitHub 소셜 로그인 ────────────────────────────────────────────────────────
document.getElementById('btn-github-signin').addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
  if (error) console.error('GitHub 로그인 실패:', error.message);
});

// ── 로그아웃 ──────────────────────────────────────────────────────────────────
document.getElementById('btn-signout').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
});
