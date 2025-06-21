const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const axios = require('axios');
const public_users = express.Router();

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (isValid(username)) {
        return res.status(409).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    return res.status(201).json({ message: "User registered successfully" });
});

// // Get all books
//   public_users.get('/', function (req, res) {
//       // Using Promise to simulate async operation
//       new Promise((resolve) => {
//           resolve(books);
//       })
//       .then((books) => {
//           return res.status(200).json(books);
//       })
//       .catch(() => {
//           return res.status(500).json({ message: "Error fetching books" });
//       });
//   });

axios.get('http://localhost:5000/')
  .then(response => {
    console.log("All books:", response.data);
  })
  .catch(error => {
    if (error.response) {
      // Server responded with error status
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    } else {
      // Other errors (network, etc.)
      console.error("Error:", error.message);
    }
  });

axios.get('http://localhost:5000/isbn/1')
  .then(response => {
    console.log("Book found:", response.data);
  })
  .catch(error => {
    console.error("Error:", error.response?.data || error.message);
  });

// Get books by author
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
    
    // Using Promise to simulate async operation
    new Promise((resolve) => {
        const booksByAuthor = Object.entries(books)
            .filter(([_, book]) => book.author.toLowerCase().includes(author.toLowerCase()))
            .reduce((acc, [isbn, book]) => ({ ...acc, [isbn]: book }), {});
        resolve(booksByAuthor);
    })
    .then((filteredBooks) => {
        if (Object.keys(filteredBooks).length === 0) {
            return res.status(404).json({ message: "No books found by this author" });
        }
        return res.status(200).json(filteredBooks);
    })
    .catch(() => {
        return res.status(500).json({ message: "Error searching books" });
    });
});

// Get books by title
const searchBooksByTitle = async (title) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/title/${encodeURIComponent(title)}`,
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (Object.keys(response.data).length === 0) {
      console.warn(`No books found containing "${title}"`);
    } else {
      console.log(`Found ${Object.keys(response.data).length} book(s) with "${title}" in title:`);
      console.table(Object.values(response.data));
    }
    return response.data;

  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error(`[${error.response.status}] ${error.response.data.message}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    } else {
      console.error('Network error:', error.message);
    }
    return null;
  }
};

// Get book reviews by ISBN
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    
    // Using Promise to simulate async operation
    new Promise((resolve, reject) => {
        const book = books[isbn];
        if (book) {
            resolve(book.reviews);
        } else {
            reject("Book not found");
        }
    })
    .then((reviews) => {
        return res.status(200).json(reviews);
    })
    .catch((err) => {
        return res.status(404).json({ message: err });
    });
});

module.exports.general = public_users;
