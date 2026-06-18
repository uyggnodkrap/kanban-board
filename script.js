const SAMPLE_CARDS = {
  'todo': ['기획서 작성', 'UI 디자인 검토', '요구사항 분석'],
  'in-progress': ['칸반보드 HTML 구현', 'CSS 스타일링'],
  'done': ['PLAN.md 작성', '설계 문서 작성'],
};

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
    updateCardCount(column);
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
  });
}

async function initBoard() {
  // 이전 세션 카드 DOM 초기화
  document.querySelectorAll('.column .cards').forEach((el) => (el.innerHTML = ''));
  document.querySelectorAll('.column .card-count').forEach((el) => (el.textContent = '0'));

  const { data: { user } } = await window.supabaseClient.auth.getUser();

  const { data: rows, error } = await window.supabaseClient
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('카드 로드 실패:', error.message);
    return;
  }

  // 카드가 없으면 샘플 카드 삽입
  if (rows.length === 0) {
    const inserts = [];
    for (const [column_id, texts] of Object.entries(SAMPLE_CARDS)) {
      for (const text of texts) {
        inserts.push({ user_id: user.id, column_id, text });
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

  // 컬럼별 카드 렌더링
  rows.forEach((row) => {
    const columnEl = document.querySelector(`.column[data-column="${row.column_id}"]`);
    if (!columnEl) return;
    addCardToColumn(createCard(row.text, row.id), columnEl);
  });

  // 폼 + 드래그앤드롭 이벤트 바인딩 (최초 1회만)
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

        const { data: { user: currentUser } } = await window.supabaseClient.auth.getUser();
        const { data, error } = await window.supabaseClient
          .from('cards')
          .insert({ user_id: currentUser.id, column_id: columnEl.dataset.column, text })
          .select()
          .single();

        if (error) {
          console.error('카드 추가 실패:', error.message);
          return;
        }

        addCardToColumn(createCard(data.text, data.id), columnEl);
        input.value = '';
        input.focus();
      });

      bindColumnDropEvents(columnEl);
    });
  }
}

window.initBoard = initBoard;
