const SAMPLE_CARDS = {
  'todo': ['기획서 작성', 'UI 디자인 검토', '요구사항 분석'],
  'in-progress': ['칸반보드 HTML 구현', 'CSS 스타일링'],
  'done': ['PLAN.md 작성', '설계 문서 작성'],
};

let _cardsChannel = null;
let _logChannel = null;

function updateCardCount(columnEl) {
  const count = columnEl.querySelectorAll('.card').length;
  columnEl.querySelector('.card-count').textContent = count;
}

function bindDragEvents(cardEl) {
  cardEl.addEventListener('dragstart', (e) => {
    cardEl.classList.add('dragging');
    e.dataTransfer.setData('text/plain', cardEl.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  cardEl.addEventListener('dragend', () => {
    cardEl.classList.remove('dragging');
    document.querySelectorAll('.column').forEach((col) => {
      col.classList.remove('drag-over');
    });
  });
}

function createCard(text, id) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = id;
  card.draggable = true;

  const span = document.createElement('span');
  span.className = 'card-text';
  span.textContent = text;

  const btn = document.createElement('button');
  btn.className = 'delete-btn';
  btn.setAttribute('aria-label', '카드 삭제');
  btn.textContent = '×';
  btn.addEventListener('click', async () => {
    const cardText = span.textContent;
    const { error } = await window.supabaseClient
      .from('cards')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('카드 삭제 실패:', error.message);
      return;
    }
    const column = card.closest('.column');
    card.remove();
    if (column) updateCardCount(column);
    logActivity('card_deleted', { card_id: id, card_text: cardText });
  });

  card.appendChild(span);
  card.appendChild(btn);
  bindDragEvents(card);

  return card;
}

function addCardToColumn(card, columnEl) {
  columnEl.querySelector('.cards').appendChild(card);
  updateCardCount(columnEl);
}

function bindColumnDropEvents(columnEl) {
  columnEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    columnEl.classList.add('drag-over');
  });

  columnEl.addEventListener('dragleave', (e) => {
    if (columnEl.contains(e.relatedTarget)) return;
    columnEl.classList.remove('drag-over');
  });

  columnEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    columnEl.classList.remove('drag-over');

    const cardId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(cardId);
    if (!card) return;

    const targetColumnId = columnEl.dataset.column;
    const originColumn = card.closest('.column');
    const fromCol = originColumn?.dataset.column;
    const cardText = card.querySelector('.card-text')?.textContent || '';

    const { error } = await window.supabaseClient
      .from('cards')
      .update({ column_id: targetColumnId })
      .eq('id', cardId);

    if (error) {
      console.error('카드 이동 실패:', error.message);
      return;
    }

    addCardToColumn(card, columnEl);
    if (originColumn && originColumn !== columnEl) {
      updateCardCount(originColumn);
    }

    if (fromCol && fromCol !== targetColumnId) {
      logActivity('card_moved', { card_id: cardId, card_text: cardText, from_col: fromCol, to_col: targetColumnId });
    }
  });
}

function handleCardChange(payload) {
  const { eventType } = payload;

  if (eventType === 'INSERT') {
    if (document.getElementById(payload.new.id)) return; // 이미 DOM에 있음 (내 추가)
    const columnEl = document.querySelector(`.column[data-column="${payload.new.column_id}"]`);
    if (columnEl) addCardToColumn(createCard(payload.new.text, payload.new.id), columnEl);
  } else if (eventType === 'UPDATE') {
    const card = document.getElementById(payload.new.id);
    if (!card) return;
    const targetColumn = document.querySelector(`.column[data-column="${payload.new.column_id}"]`);
    if (!targetColumn) return;
    const currentColumn = card.closest('.column');
    if (currentColumn !== targetColumn) {
      addCardToColumn(card, targetColumn);
      if (currentColumn) updateCardCount(currentColumn);
    }
    const textSpan = card.querySelector('.card-text');
    if (textSpan) textSpan.textContent = payload.new.text;
  } else if (eventType === 'DELETE') {
    const card = document.getElementById(payload.old.id);
    if (!card) return;
    const column = card.closest('.column');
    card.remove();
    if (column) updateCardCount(column);
  }
}

function logActivity(action, details = {}) {
  if (!window.currentBoardId || !window.currentUser) return;
  window.supabaseClient.from('activity_log').insert({
    board_id: window.currentBoardId,
    user_id: window.currentUser.id,
    user_email: window.currentUser.email || '',
    action,
    card_id: details.card_id ?? null,
    card_text: details.card_text ?? null,
    from_col: details.from_col ?? null,
    to_col: details.to_col ?? null,
  }).then(({ error }) => {
    if (error) console.error('활동 로그 기록 실패:', error.message);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildActivityLi(entry) {
  const li = document.createElement('li');
  li.className = 'activity-item';
  li.dataset.logId = entry.id;

  const COL = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' };
  const who = `<strong>${escapeHtml(entry.user_email.split('@')[0])}</strong>`;
  const txt = entry.card_text ? `'<strong>${escapeHtml(entry.card_text)}</strong>'` : '';

  let actionHtml = '';
  switch (entry.action) {
    case 'card_added':
      actionHtml = `${who}이 <strong>${COL[entry.to_col] || entry.to_col}</strong>에 ${txt} 카드를 추가했습니다`;
      break;
    case 'card_deleted':
      actionHtml = `${who}이 ${txt} 카드를 삭제했습니다`;
      break;
    case 'card_moved':
      actionHtml = `${who}이 ${txt} 카드를 <strong>${COL[entry.from_col] || entry.from_col} → ${COL[entry.to_col] || entry.to_col}</strong>으로 이동했습니다`;
      break;
    case 'member_joined':
      actionHtml = `${who}이 보드에 참여했습니다`;
      break;
    default:
      actionHtml = `${who}이 작업을 수행했습니다`;
  }

  const now = new Date();
  const created = new Date(entry.created_at);
  const diffMin = Math.floor((now - created) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  let timeText;
  if (diffMin < 1) timeText = '방금';
  else if (diffMin < 60) timeText = `${diffMin}분 전`;
  else if (diffHour < 24) timeText = `${diffHour}시간 전`;
  else timeText = created.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  li.innerHTML = `<span class="activity-text">${actionHtml}</span><time datetime="${entry.created_at}">${timeText}</time>`;
  return li;
}

function renderActivityEntry(entry) {
  const list = document.getElementById('activity-list');
  if (!list) return;
  if (list.querySelector(`[data-log-id="${entry.id}"]`)) return; // 중복 방지
  const li = buildActivityLi(entry);
  list.insertBefore(li, list.firstChild);
  const empty = list.querySelector('.activity-empty');
  if (empty) empty.remove();
}

async function initActivityLog() {
  const list = document.getElementById('activity-list');
  if (!list) return;
  list.innerHTML = '<li class="activity-empty">아직 활동이 없습니다.</li>';

  const { data, error } = await window.supabaseClient
    .from('activity_log')
    .select('*')
    .eq('board_id', window.currentBoardId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('활동 로그 로드 실패:', error.message);
    return;
  }

  if (data && data.length > 0) {
    list.innerHTML = '';
    // DESC 정렬이므로 data[0]이 최신 → appendChild로 순서대로 추가하면 최신이 위에 위치
    data.forEach((entry) => list.appendChild(buildActivityLi(entry)));
  }

  if (_logChannel) window.supabaseClient.removeChannel(_logChannel);
  _logChannel = window.supabaseClient
    .channel('log-' + window.currentBoardId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_log',
      filter: `board_id=eq.${window.currentBoardId}`,
    }, (payload) => renderActivityEntry(payload.new))
    .subscribe();
}

async function initBoard() {
  document.querySelectorAll('.column .cards').forEach((el) => (el.innerHTML = ''));
  document.querySelectorAll('.column .card-count').forEach((el) => (el.textContent = '0'));

  if (_cardsChannel) {
    window.supabaseClient.removeChannel(_cardsChannel);
    _cardsChannel = null;
  }

  const { data: rows, error } = await window.supabaseClient
    .from('cards')
    .select('*')
    .eq('board_id', window.currentBoardId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('카드 로드 실패:', error.message);
    return;
  }

  if (rows.length === 0) {
    const inserts = [];
    for (const [column_id, texts] of Object.entries(SAMPLE_CARDS)) {
      for (const text of texts) {
        inserts.push({ board_id: window.currentBoardId, column_id, text });
      }
    }
    const { data: inserted, error: insertError } = await window.supabaseClient
      .from('cards')
      .insert(inserts)
      .select();

    if (insertError) {
      console.error('샘플 카드 삽입 실패:', insertError.message);
    } else {
      rows.push(...inserted);
    }
  }

  rows.forEach((row) => {
    const columnEl = document.querySelector(`.column[data-column="${row.column_id}"]`);
    if (!columnEl) return;
    addCardToColumn(createCard(row.text, row.id), columnEl);
  });

  if (!window._boardEventsInitialized) {
    window._boardEventsInitialized = true;

    document.querySelectorAll('.column').forEach((columnEl) => {
      const form = columnEl.querySelector('.add-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input');
        const text = input.value.trim();
        if (!text) {
          input.focus();
          return;
        }

        const { data, error } = await window.supabaseClient
          .from('cards')
          .insert({ board_id: window.currentBoardId, column_id: columnEl.dataset.column, text })
          .select()
          .single();

        if (error) {
          console.error('카드 추가 실패:', error.message);
          return;
        }

        addCardToColumn(createCard(data.text, data.id), columnEl);
        input.value = '';
        input.focus();
        logActivity('card_added', { card_id: data.id, card_text: data.text, to_col: columnEl.dataset.column });
      });

      bindColumnDropEvents(columnEl);
    });
  }

  _cardsChannel = window.supabaseClient
    .channel('cards-' + window.currentBoardId)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cards',
      filter: `board_id=eq.${window.currentBoardId}`,
    }, handleCardChange)
    .subscribe();

  initActivityLog();
}

window.initBoard = initBoard;
