// Page Navigation System
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'watchlistPage') loadWatchlist();
}

// Main Function Data Fetch from Open Library API
function fetchBooks(query) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '<p>Loading book data...</p>';

  fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=100`)
    .then(res => res.json())
    .then(data => {
      resultsDiv.innerHTML = '';
      if (!data.docs || data.docs.length === 0) {
        resultsDiv.innerHTML = '<p>No books found. Try another keyword.</p>';
        return;
      }

      data.docs.forEach(book => {
        const title = book.title;
        const author = book.author_name ? book.author_name[0] : 'Unknown Author';
        const pageEstimate = book.number_of_pages_median || (150 + (book.title.length * 13) % 250);

        // Meaningful Calculation (Estimated Reading Hours)
        const readingHours = ((pageEstimate * 1.5) / 60).toFixed(1);

        // Suggestion Logic (Control Statement)
        let badgeText = '';
        if (pageEstimate < 150) {
          badgeText = '⚡ Quick Read';
        } else if (pageEstimate > 350) {
          badgeText = '📖 Detailed Read';
        } else {
          badgeText = '👍 Standard Read';
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h4>${title}</h4>
          <p><strong>Author:</strong> ${author}</p>
          <p><strong>Total Pages:</strong> ${pageEstimate} pages</p>
          <p><strong>Reading Time:</strong> ~${readingHours} Hours</p>
          <p><span class="badge">${badgeText}</span></p>
          <button class="btn-main" onclick="saveToWatchlist('${escapeHtml(title)}', '${escapeHtml(author)}', ${pageEstimate})">Save to Reading List</button>
        `;
        resultsDiv.appendChild(card);
      });
    })
    .catch(err => {
      resultsDiv.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const genreBtn = document.getElementById('searchGenreBtn');
  if(genreBtn) {
    genreBtn.addEventListener('click', () => {
      const genre = document.getElementById('genre').value;
      fetchBooks(genre);
    });
  }

  const titleBtn = document.getElementById('searchTitleBtn');
  if(titleBtn) {
    titleBtn.addEventListener('click', () => {
      const titleQuery = document.getElementById('bookTitleInput').value.trim();
      if (!titleQuery) {
        alert('Please enter a book title to search!');
        return;
      }
      fetchBooks(titleQuery);
    });
  }
});

// Helper Function
function escapeHtml(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '"');
}

// CRUD & LocalStorage Functionality
function getStoredBooks() {
  return JSON.parse(localStorage.getItem('imybook_list')) || [];
}

function saveBooks(books) {
  localStorage.setItem('imybook_list', JSON.stringify(books));
}

// CREATE (From API)
function saveToWatchlist(title, author, pages) {
  const books = getStoredBooks();
  books.push({ id: Date.now(), title, author, pages, status: 'Reading' });
  saveBooks(books);
  alert('Book successfully saved to your Reading List!');
}

// CREATE (Manual)
function addManualBook() {
  const title = document.getElementById('manualTitle').value;
  const author = document.getElementById('manualAuthor').value;
  const pages = document.getElementById('manualPages').value;

  if (!title || !pages) {
    alert('Please fill in the book title and total pages!');
    return;
  }

  const books = getStoredBooks();
  books.push({ id: Date.now(), title, author: author || 'Unknown', pages: parseInt(pages), status: 'Reading' });
  saveBooks(books);
  
  document.getElementById('manualTitle').value = '';
  document.getElementById('manualAuthor').value = '';
  document.getElementById('manualPages').value = '';
  loadWatchlist();
  alert('Manual book successfully added!');
}

// READ 
function loadWatchlist() {
  const watchlistDiv = document.getElementById('watchlistResults');
  if(!watchlistDiv) return;
  
  const books = getStoredBooks();
  watchlistDiv.innerHTML = '';

  if (books.length === 0) {
    watchlistDiv.innerHTML = '<p>No books in your saved list.</p>';
    return;
  }

  books.forEach(book => {
    const readingHours = ((book.pages * 1.5) / 60).toFixed(1);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h4>${book.title}</h4>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Total Pages:</strong> ${book.pages} pages</p>
      <p><strong>Estimated Time:</strong> ~${readingHours} Hours</p>
      <p><strong>Status:</strong> <b style="color:#2980b9;">${book.status}</b></p>
      <button class="btn-edit" onclick="updateStatus(${book.id})">Toggle Status</button>
      <button class="btn-danger" onclick="deleteBook(${book.id})">Delete</button>
    `;
    watchlistDiv.appendChild(card);
  });
}

// UPDATE 
function updateStatus(id) {
  const books = getStoredBooks();
  const book = books.find(b => b.id === id);
  if (book) {
    book.status = book.status === 'Reading' ? 'Completed' : 'Reading';
    saveBooks(books);
    loadWatchlist();
  }
}

// DELETE 
function deleteBook(id) {
  let books = getStoredBooks();
  books = books.filter(b => b.id !== id);
  saveBooks(books);
  loadWatchlist();
}