async function loadOrCreateBoard(user) {
  const supabase = window.supabaseClient;

  const { data: owned } = await supabase
    .from('boards')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1);

  if (owned && owned.length > 0) {
    window.currentBoardId = owned[0].id;
    return owned[0];
  }

  const { data: membership } = await supabase
    .from('board_members')
    .select('board_id')
    .eq('user_id', user.id)
    .limit(1);

  if (membership && membership.length > 0) {
    window.currentBoardId = membership[0].board_id;
    return { id: membership[0].board_id };
  }

  const { data: newBoard, error } = await supabase
    .from('boards')
    .insert({ owner_id: user.id, name: 'My Board' })
    .select('id')
    .single();

  if (error) {
    console.error('보드 생성 실패:', error.message);
    return null;
  }

  window.currentBoardId = newBoard.id;
  return newBoard;
}

async function acceptInvite(user, code) {
  const supabase = window.supabaseClient;

  const { data: invite } = await supabase
    .from('board_invites')
    .select('board_id, expires_at')
    .eq('code', code)
    .maybeSingle();

  sessionStorage.removeItem('pendingInvite');

  if (!invite) {
    showToast('유효하지 않은 초대 링크입니다.', true);
    await loadOrCreateBoard(user);
    return;
  }

  if (new Date(invite.expires_at) < new Date()) {
    showToast('만료된 초대 링크입니다.', true);
    await loadOrCreateBoard(user);
    return;
  }

  const boardId = invite.board_id;

  // 이미 오너인지 확인
  const { data: owned } = await supabase
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!owned) {
    const { data: existing } = await supabase
      .from('board_members')
      .select('board_id')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      const { error: joinError } = await supabase
        .from('board_members')
        .insert({ board_id: boardId, user_id: user.id });

      if (joinError) {
        console.error('보드 합류 실패:', joinError.message);
        showToast('보드 합류에 실패했습니다.', true);
        await loadOrCreateBoard(user);
        return;
      }

      supabase.from('activity_log').insert({
        board_id: boardId,
        user_id: user.id,
        user_email: user.email,
        action: 'member_joined',
      }).then(({ error }) => {
        if (error) console.error('합류 로그 기록 실패:', error.message);
      });

      showToast('보드에 합류했습니다!');
    }
  }

  window.currentBoardId = boardId;
  history.replaceState({}, '', window.location.pathname);
}

async function generateInviteLink() {
  const supabase = window.supabaseClient;

  const { data, error } = await supabase
    .from('board_invites')
    .insert({ board_id: window.currentBoardId, created_by: window.currentUser.id })
    .select('code')
    .single();

  if (error) {
    console.error('초대 링크 생성 실패:', error.message);
    showToast('초대 링크 생성에 실패했습니다.', true);
    return;
  }

  const url = `${window.location.origin}${window.location.pathname}?invite=${data.code}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('초대 링크가 클립보드에 복사되었습니다!');
  } catch {
    showToast(`링크를 직접 복사하세요: ${url}`);
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

document.getElementById('btn-invite')?.addEventListener('click', generateInviteLink);

window.loadOrCreateBoard = loadOrCreateBoard;
window.acceptInvite = acceptInvite;
window.showToast = showToast;
