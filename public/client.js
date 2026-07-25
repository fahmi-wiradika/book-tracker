$(document).ready(function () {
  const state = {
    books: [],
    filtered: [],
    selectedBookId: null,
    selectedBookDetail: null,
    searchTerm: '',
    sortMode: 'newest',
    currentPage: 1,
    itemsPerPage: 6
  };

  const MOCK_AUTHORS = [
    { name: 'Alice', initial: 'A', bgClass: 'badge-purple' },
    { name: 'Bob', initial: 'B', bgClass: 'badge-green' },
    { name: 'Charlie', initial: 'C', bgClass: 'badge-blue' },
    { name: 'Diana', initial: 'D', bgClass: 'badge-orange' },
    { name: 'Evan', initial: 'E', bgClass: 'badge-violet' },
    { name: 'Fiona', initial: 'F', bgClass: 'badge-slate' },
    { name: 'George', initial: 'G', bgClass: 'badge-purple' },
    { name: 'Hannah', initial: 'H', bgClass: 'badge-green' }
  ];

  const BADGE_COLORS = ['badge-purple', 'badge-green', 'badge-blue', 'badge-orange', 'badge-slate', 'badge-violet'];

  const $bookGrid = $('#bookGrid');
  const $booksEmpty = $('#booksEmpty');
  const $booksState = $('#booksState');
  const $detailEmpty = $('#detailEmpty');
  const $detailView = $('#detailView');
  const $detailTitle = $('#detailTitle');
  const $detailComments = $('#detailComments');
  const $resultCount = $('#resultCount');
  const $commentCountPill = $('#commentCountPill');

  const $toast = $('#toast');
  const $toastTitle = $('#toastTitle');
  const $toastMessage = $('#toastMessage');
  const $toastIcon = $('#toastIcon');

  const $overlay = $('#overlay');
  const $bookModal = $('#bookModal');
  const $deleteAllModal = $('#deleteAllModal');
  const $aboutModal = $('#aboutModal');
  const $appLayout = $('#appLayout');
  const $mobileNavOverlay = $('#mobileNavOverlay');
  const $dashboardBody = $('.dashboard-body');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(title, message, type = 'success') {
    $toast
      .removeClass('hidden success error')
      .addClass(type);

    $toastTitle.text(title);
    $toastMessage.text(message || '');
    $toastIcon.text(type === 'success' ? '✓' : '!');

    window.clearTimeout(window.toastTimer);
    window.toastTimer = window.setTimeout(() => {
      $toast.addClass('hidden');
    }, 3200);
  }

  $('#closeToast').on('click', function () {
    $toast.addClass('hidden');
  });

  function setLoading(isLoading) {
    $booksState.toggleClass('hidden', !isLoading);
  }

  /* Modal Helpers */
  function openModal($modal) {
    $overlay.removeClass('hidden');
    $('.modal-card').addClass('hidden');
    $modal.removeClass('hidden');
    if ($modal.attr('id') === 'bookModal') {
      $('#modalBookTitle').trigger('focus');
    }
  }

  function closeModal() {
    $overlay.addClass('hidden');
    $('.modal-card').addClass('hidden');
    $('#modalNewBookForm')[0].reset();
  }

  $('.closeModalBtn').on('click', function () {
    closeModal();
  });

  $overlay.on('click', function () {
    closeModal();
  });

  /* Theme Toggle */
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    $('body').addClass('dark-theme');
    $('#themeMoonIcon').addClass('hidden');
    $('#themeSunIcon').removeClass('hidden');
  }

  $('#themeToggle').on('click', function () {
    const isDark = $('body').toggleClass('dark-theme').hasClass('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    $('#themeMoonIcon').toggleClass('hidden', isDark);
    $('#themeSunIcon').toggleClass('hidden', !isDark);
  });

  /* Mobile Navigation Drawer */
  function openMobileNav() {
    $appLayout.addClass('sidebar-open');
    $mobileNavOverlay.removeClass('hidden');
  }

  function closeMobileNav() {
    $appLayout.removeClass('sidebar-open');
    $mobileNavOverlay.addClass('hidden');
  }

  $('#menuToggle').on('click', openMobileNav);
  $('#closeSidebarBtn, #mobileNavOverlay').on('click', closeMobileNav);
  $('.sidebar-nav a, .sidebar-nav button').on('click', closeMobileNav);

  /* Mobile Detail View Layout Switcher */
  function updateMobileView() {
    const isMobile = $(window).width() <= 768;
    if (isMobile && state.selectedBookId) {
      $dashboardBody.addClass('mobile-show-detail');
    } else {
      $dashboardBody.removeClass('mobile-show-detail');
    }
  }

  $(window).on('resize', updateMobileView);

  $('#mobileBackBtn').on('click', function () {
    deselectBook();
  });

  function getBookBadgeColor(title, index) {
    if (!title) return BADGE_COLORS[index % BADGE_COLORS.length];
    const charCodeSum = title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return BADGE_COLORS[charCodeSum % BADGE_COLORS.length];
  }

  function getBookInitial(title) {
    const trimmed = (title || '').trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  }

  function sortBooks(list) {
    const sorted = [...list];

    switch (state.sortMode) {
      case 'oldest':
        return sorted;
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'comments':
        return sorted.sort((a, b) => (b.commentcount || 0) - (a.commentcount || 0));
      case 'newest':
      default:
        return sorted.reverse();
    }
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const $pageNumbers = $('#pageNumbers').empty();
    const $prevBtn = $('#prevPage');
    const $nextBtn = $('#nextPage');

    $prevBtn.prop('disabled', state.currentPage <= 1);
    $nextBtn.prop('disabled', state.currentPage >= totalPages);

    for (let i = 1; i <= totalPages; i++) {
      const isCurrent = i === state.currentPage;
      const $numBtn = $(`<button class="page-btn ${isCurrent ? 'active' : ''}" type="button">${i}</button>`);
      $numBtn.on('click', () => {
        state.currentPage = i;
        renderBooks();
      });
      $pageNumbers.append($numBtn);
    }
  }

  function renderBooks() {
    const query = state.searchTerm.trim().toLowerCase();
    const filtered = state.books.filter((book) =>
      (book.title || '').toLowerCase().includes(query)
    );

    state.filtered = sortBooks(filtered);
    $resultCount.text(state.filtered.length);

    $bookGrid.empty();

    if (!state.books.length) {
      $booksState.addClass('hidden');
      $booksEmpty.removeClass('hidden');
      $detailEmpty.removeClass('hidden');
      $detailView.addClass('hidden');
      $('#pagination').addClass('hidden');
      updateMobileView();
      return;
    }

    $booksEmpty.addClass('hidden');
    $booksState.addClass('hidden');

    if (!state.filtered.length) {
      $bookGrid.html(
        '<div class="state-container" style="grid-column: 1 / -1;"><h3>No matching books found</h3><p>Try searching with another keyword.</p></div>'
      );
      $('#pagination').addClass('hidden');
      updateMobileView();
      return;
    }

    $('#pagination').removeClass('hidden');
    renderPagination(state.filtered.length);

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const paginatedBooks = state.filtered.slice(startIndex, startIndex + state.itemsPerPage);

    paginatedBooks.forEach((book, idx) => {
      const isSelected = state.selectedBookId === book._id;
      const badgeColor = getBookBadgeColor(book.title, idx);
      const initial = getBookInitial(book.title);
      const commentsCount = book.commentcount || 0;
      const fakeDate = 'May 20, 2024';

      const card = $(`
        <article class="book-card ${isSelected ? 'selected' : ''}" data-id="${book._id}">
          <div class="book-initial-badge ${badgeColor}">
            ${escapeHtml(initial)}
          </div>
          <div class="book-info">
            <h4 class="book-card-title">${escapeHtml(book.title)}</h4>
            <div class="book-card-comments">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="comment-icon-purple">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>${commentsCount} comment${commentsCount === 1 ? '' : 's'}</span>
            </div>
            <div class="book-card-date">${fakeDate}</div>
          </div>
        </article>
      `);

      $bookGrid.append(card);
    });

    updateMobileView();
  }

  function renderDetail(book) {
    state.selectedBookDetail = book;
    state.selectedBookId = book._id;

    $detailTitle.text(book.title);
    const count = book.commentcount || (book.comments ? book.comments.length : 0);
    $commentCountPill.text(`${count} comment${count === 1 ? '' : 's'}`);

    const comments = book.comments || [];
    $detailComments.empty();

    if (!comments.length) {
      $detailComments.append(`
        <div style="text-align: center; padding: 28px 12px; color: var(--text-muted); font-size: 0.88rem;">
          No comments yet. Add the first comment below!
        </div>
      `);
    } else {
      comments.forEach((comment, index) => {
        const author = MOCK_AUTHORS[index % MOCK_AUTHORS.length];
        const dateStr = 'May 19, 2024';

        const commentCard = $(`
          <div class="comment-item-card">
            <div class="comment-author-row">
              <div class="author-info">
                <div class="avatar-circle ${author.bgClass}">${author.initial}</div>
                <span class="author-name">${author.name}</span>
              </div>
              <div class="comment-meta-right">
                <span class="comment-date">${dateStr}</span>
                <span class="more-dots">⋮</span>
              </div>
            </div>
            <div class="comment-text-body">${escapeHtml(comment)}</div>
          </div>
        `);
        $detailComments.append(commentCard);
      });
    }

    $detailEmpty.addClass('hidden');
    $detailView.removeClass('hidden');
    renderBooks();
    updateMobileView();
  }

  async function requestJSON(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        ...(options.headers || {})
      },
      ...options
    });

    const text = await response.text();
    let payload = text;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch (error) {
      // Plain text API responses
    }

    if (!response.ok) {
      const message = typeof payload === 'string'
        ? payload
        : (payload && payload.message) || 'Request failed';
      throw new Error(message);
    }

    return payload;
  }

  async function loadBooks({ selectFirst = false } = {}) {
    setLoading(true);

    try {
      const data = await requestJSON('/api/books', { method: 'GET' });
      state.books = Array.isArray(data) ? data : [];
      renderBooks();

      if (selectFirst && state.books.length && !state.selectedBookId && $(window).width() > 768) {
        selectBook(state.books[0]._id);
      } else if (state.selectedBookId) {
        const stillExists = state.books.some((book) => book._id === state.selectedBookId);
        if (stillExists) {
          await selectBook(state.selectedBookId);
        } else {
          deselectBook();
        }
      }
    } catch (error) {
      showToast('Error', error.message || 'Failed to load books', 'error');
      $bookGrid.html(
        '<div class="state-container" style="grid-column: 1 / -1;"><h3>Could not load books</h3><p>Please refresh and try again.</p></div>'
      );
    } finally {
      setLoading(false);
    }
  }

  async function selectBook(bookId) {
    try {
      const book = await requestJSON(`/api/books/${bookId}`, { method: 'GET' });
      renderDetail(book);
    } catch (error) {
      showToast('Failed to fetch detail', error.message || 'Could not load book detail', 'error');
    }
  }

  function deselectBook() {
    state.selectedBookId = null;
    state.selectedBookDetail = null;
    $detailView.addClass('hidden');
    $detailEmpty.removeClass('hidden');
    renderBooks();
    updateMobileView();
  }

  function getFormBody(form) {
    return new URLSearchParams(new FormData(form)).toString();
  }

  /* Actions & Event Listeners */
  $('#searchBooks').on('input', function () {
    state.searchTerm = $(this).val();
    state.currentPage = 1;
    renderBooks();
  });

  $('#sortBooks').on('change', function () {
    state.sortMode = $(this).val();
    renderBooks();
  });

  /* "Library" Nav Click */
  $('#navLibrary').on('click', function () {
    deselectBook();
    state.currentPage = 1;
    renderBooks();
    closeMobileNav();
    $('.sidebar-nav .nav-link').removeClass('active');
    $(this).addClass('active');
  });

  $('#emptyAddBook, #sidebarAddBook').on('click', function () {
    openModal($bookModal);
  });

  $('#navClearAll, #deleteAllBooksDev').on('click', function () {
    openModal($deleteAllModal);
  });

  $('#navAbout').on('click', function () {
    openModal($aboutModal);
  });

  $('#closeDetailView').on('click', function () {
    deselectBook();
  });

  $('#prevPage').on('click', function () {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderBooks();
    }
  });

  $('#nextPage').on('click', function () {
    const totalPages = Math.ceil(state.filtered.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderBooks();
    }
  });

  /* Add Book Form Submit */
  $('#modalNewBookForm').on('submit', async function (event) {
    event.preventDefault();

    const title = $('#modalBookTitle').val().trim();
    if (!title) {
      showToast('Failed to add book', 'Title is required.', 'error');
      return;
    }

    try {
      const data = await requestJSON('/api/books', {
        method: 'POST',
        body: getFormBody(this)
      });

      showToast('Book added successfully!', `The book "${data.title}" has been added to your library.`, 'success');
      closeModal();
      await loadBooks({ selectFirst: true });
      if (data._id) {
        await selectBook(data._id);
      }
    } catch (error) {
      showToast('Failed to add book', error.message || 'Title is required.', 'error');
    }
  });

  $('#newBookForm').on('submit', async function (event) {
    event.preventDefault();
    const title = $('#bookTitleToAdd').val().trim();
    if (!title) {
      showToast('Failed to add book', 'Title is required.', 'error');
      return;
    }

    try {
      const data = await requestJSON('/api/books', {
        method: 'POST',
        body: getFormBody(this)
      });

      showToast('Book added successfully!', `The book "${data.title}" has been added.`, 'success');
      $('#bookTitleToAdd').val('');
      await loadBooks({ selectFirst: true });
      if (data._id) {
        await selectBook(data._id);
      }
    } catch (error) {
      showToast('Failed to add book', error.message || 'Title is required.', 'error');
    }
  });

  $('#bookGrid').on('click', '.book-card', function () {
    const bookId = $(this).data('id');
    selectBook(bookId);
  });

  /* Comment Form Submit */
  $('#newCommentForm').on('submit', async function (event) {
    event.preventDefault();

    if (!state.selectedBookId) {
      showToast('Action Failed', 'Select a book first.', 'error');
      return;
    }

    const comment = $('#commentToAdd').val().trim();
    if (!comment) {
      showToast('Failed to add comment', 'Comment is required.', 'error');
      return;
    }

    try {
      await requestJSON(`/api/books/${state.selectedBookId}`, {
        method: 'POST',
        body: getFormBody(this)
      });

      $('#commentToAdd').val('');
      showToast('Comment added!', 'Your comment has been added successfully.', 'success');
      await selectBook(state.selectedBookId);
      await loadBooks({ selectFirst: false });
    } catch (error) {
      showToast('Failed to add comment', error.message || 'Could not post comment.', 'error');
    }
  });

  /* Delete Single Book */
  $('#deleteBook').on('click', async function () {
    if (!state.selectedBookId) {
      return;
    }

    const confirmed = window.confirm('Delete this book? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await requestJSON(`/api/books/${state.selectedBookId}`, { method: 'DELETE' });
      showToast('Book deleted', 'The book was permanently removed.', 'success');
      deselectBook();
      await loadBooks({ selectFirst: true });
    } catch (error) {
      showToast('Delete failed', error.message || 'Failed to delete book.', 'error');
    }
  });

  /* Confirm Delete All Books */
  $('#confirmDeleteAllBtn').on('click', async function () {
    try {
      await requestJSON('/api/books', { method: 'DELETE' });
      showToast('Library Cleared', 'All books and comments have been deleted.', 'success');
      closeModal();
      deselectBook();
      await loadBooks();
    } catch (error) {
      showToast('Delete failed', error.message || 'Failed to delete all books.', 'error');
    }
  });

  $(document).on('keydown', function (event) {
    if (event.key === 'Escape') {
      closeModal();
      closeMobileNav();
    }
  });

  loadBooks({ selectFirst: true });
});