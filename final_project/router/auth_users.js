// const express = require('express');
// const jwt = require('jsonwebtoken');
// let books = require("./booksdb.js");
// const regd_users = express.Router();

// let users = [];

// const isValid = (username)=>{ //returns boolean
// //write code to check is the username is valid
// }

// const authenticatedUser = (username,password)=>{ //returns boolean
// //write code to check if username and password match the one we have in records.
// }

// //only registered users can login
// regd_users.post("/login", (req,res) => {
//   //Write your code here
//   return res.status(300).json({message: "Yet to be implemented"});
// });

// // Add a book review
// regd_users.put("/auth/review/:isbn", (req, res) => {
//   //Write your code here
//   return res.status(300).json({message: "Yet to be implemented"});
// });

// module.exports.authenticated = regd_users;
// module.exports.isValid = isValid;
// module.exports.users = users;

const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Returns boolean if username is valid (exists in users array)
const isValid = (username) => {
    return users.some(user => user.username === username);
}

// Returns boolean if username and password match the records
const authenticatedUser = (username, password) => {
    return users.some(user => 
        user.username === username && user.password === password
    );
}

regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const accessToken = jwt.sign(
        { username },
        "fingerprint_customer",
        { expiresIn: '1h' }
    );

    // Explicitly save the session
    req.session.authorization = { accessToken };
    req.session.save(err => {
        if (err) {
            return res.status(500).json({ message: "Session error" });
        }
        return res.status(200).json({ 
            message: "Login successful",
            token: accessToken // Optional: return token for debugging
        });
    });
});

// Add or update a book review (authenticated users only)
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.body;
    const username = req.user.username; // From JWT token

    if (!review) {
        return res.status(400).json({ message: "Review text is required" });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Add or update the review
    books[isbn].reviews[username] = review;

    return res.status(200).json({ 
        message: "Review added/updated successfully",
        book: books[isbn]
    });
});

// Delete a book review (authenticated users only)
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.user.username; // From JWT token

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews[username]) {
        return res.status(404).json({ message: "Review not found for this user" });
    }

    // Delete the review
    delete books[isbn].reviews[username];

    return res.status(200).json({ 
        message: "Review deleted successfully",
        book: books[isbn]
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;