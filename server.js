//-----------------------------------//
// Admin and User Credentials
const adminName = 'jerome';
const adminPassword = '1234';
// all users username = name & password = name + "1234" ex sammy sammy1234
//-----------------------------------//
const express = require('express');
const port = 4000;
const app = express();
const path = require('path');

// Static Files Middleware

// View Engine Configuration for Handlebars
const exphbs = require('express-handlebars');
// Set up Handlebars
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    partialsDir: 'views/partials/' // Register the partials folder
}));
app.use(express.static('public'));


app.set('view engine', 'handlebars');
app.set('views', './views');

// Body Parser Middleware for Parsing Form Data
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session Handling
const session = require('express-session');

app.use(session({
    secret: 'sessionSecret',
    resave: true,
    saveUninitialized: true,
}));

// middleware
app.use((req, res, next) => {
    console.log('Session middleware triggered');
    if (req.session.user) {
        console.log('User in session:', req.session.user);
        // Pass the entire user object to res.locals
        res.locals.user = req.session.user;
    }
    next();
});

// Home Page Route
app.get('/', (req, res) => {
    res.status(200);
    console.log('default route');
    res.render('home.handlebars');
});

// About Us Page Route
app.get('/AboutUs', (req, res) => {
    res.status(200);
    console.log('AboutUs route');
    res.render('aboutUs.handlebars');
});

// Contact Us Page Route
app.get('/ContactUs', (req, res) => {
    res.status(200);
    console.log('contactUs route');
    res.render('ContactUs.handlebars', {
        companyName: 'SnapBuy',
        phoneNumber: '070 007 07 07',
        email: 'info@SnapBuy.com'
    });
});

//log in
app.use(bodyParser.urlencoded({ extended: true }));
//const usersdb = new sqlite3.Database('users.db');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//creates Users database 
const usersdb = new sqlite3.Database('users.db')
usersdb.serialize(() => {
    usersdb.run(`CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      password TEXT NOT NULL
    )`);
});

// BCrypt for Password Hashing
const bcrypt = require('bcryptjs');

// Login Page Route
app.get('/login', (req, res) => {
    console.log("login route");
    res.render('login'); // Renders login.handlebars
});

const util = require('util');
const getUser = util.promisify(usersdb.get).bind(usersdb);

//post Login so that when a user enters a log in a session gets started. takes username and password thus compares password with bcrypt password
app.post('/login', async (req, res) => {
    const { username, password } = req.body;  // Get username and password from request body

    // Validate input
    if (!username || !password) {
        return res.status(400).send("Username and password are required.");
    }

    // Query the database for the user
    usersdb.get("SELECT * FROM users WHERE userName = ?",
        [username],  // Use `username` consistently here
        async (err, user) => {
            if (err) {
                return res.status(500).send("Server error");
            } else if (!user) {
                return res.status(401).send("User not found");
            }

            // Compare password with the stored hashed password
            const result = await bcrypt.compare(password, user.password);
            if (!result) {
                return res.status(401).send("Wrong password");
            }

            // If the password matches, log the user in by setting session variables
            req.session.user = user;  // Store the user object in the session
            req.session.isLoggedIn = true;  // Set an additional flag for logged-in status
            console.log('Login successful:', user.userName);

            // Redirect to the home page or render the view
            res.status(200).render('home.handlebars', { user });  // Assuming home.handlebars exists passing user as a parameter
        }
    );
});

//gets the signup page and renders the page 
app.get('/signup', (req, res) => {
    console.log('sign up route');
    res.render('signup.handlebars'); // Renders signup.handlebars form
});

// Signup route to handle form submission
// Entered username and password (hashed password) gets stored in the database.
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 14);

    // Insert the user into the database
    const insertUser = `INSERT INTO users (userName, password) VALUES (?, ?)`;
    usersdb.run(insertUser, [username, hashedPassword], (err) => {

        if (err) {
            return console.error(err.message);
        }
        console.log(`User ${username} signed up successfully.`);
        console.log('user: ', username);
        console.log('password: ', hashedPassword);
        res.redirect('login.handlebars');  // Redirect to the login page after successful signup
    });
});

// Logout Route destroyes the current session
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        } else {
            res.redirect('/'); // Redirect to login page after logout
        }
    });
});

//creates a product database to store the products (has about 10 products pre stored int the db)
const db = new sqlite3.Database('products.db')

// runs the products on the website
app.get('/products', (req, res) => {
    console.log('products route');

    // Finalize the selected statement
    db.all("SELECT id, category, product, price, location, warehouse FROM products", [], (err, rows) => {
        //db.all("SELECT id, category, product, price, location, warehouse FROM products", [], (err, rows) => {

        if (err) {
            return console.error(err.message);
        }
        // Pass the products to the Handlebars template
        res.render('list', { products: rows });
    });
});

// if a costumer wants to review an indivual product
app.get('/products/:id', (req, res) => {
    console.log('products ID route');

    const productId = req.params.id; // Get the product ID from the URL

    // Query the database for the specific product
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            return res.status(404).send('Product not found'); // Handle case where product doesn't exist
        }

        // Pass the product details to the Handlebars template
        res.render('product-detail', { product: row });
    });
});

//only users with a session can edit a particular product (secret products not editable.)
app.get('/products/edit/:id', (req, res) => {
    console.log('products EDIT route');

    const productId = req.params.id;

    // Retrieve product details from the database based on the id
    const sql = 'SELECT id, category, product, price, location, warehouse FROM products WHERE id = ?';
    db.get(sql, [productId], (err, product) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        // If product is found, render the edit form with product data
        if (product) {
            res.render('editProduct', { product });
        } else {
            res.status(404).send('Product not found');
        }
    });
});

//update the information about the edit product
app.post('/products/edit/:id', (req, res) => {
    console.log('products EDIT POST-route');

    const productId = req.params.id;
    const { category, product, price, location, warehouse } = req.body;

    const sql = `
        UPDATE products
        SET category = ?, product = ?, price = ?, location = ?, warehouse = ?
        WHERE id = ?
    `;
    const params = [category, product, price, location, warehouse, productId];

    // Execute the update query
    db.run(sql, params, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Error updating the product');
        }

        // Redirect to the product list after updating
        res.redirect('/products');
    });
});

//delete product if it no longer is sold by a vendor
app.post('/products/delete/:id', (req, res) => {
    console.log('products DELETE POST-route');

    const productId = req.params.id;

    // SQL query to delete the product based on id
    const sql = 'DELETE FROM products WHERE id = ?';

    // Execute the delete query
    db.run(sql, [productId], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Error deleting the product');
        }

        // Redirect to the product list after deleting
        res.redirect('/products');
    });
});

//render the create handlebar
app.get('/create', (req, res) => {
    res.render('createProduct.handlebars');
});

//create a new product incase a vendor wants to sell more products
app.post('/create', (req, res) => {
    const { category, product, price, location, warehouse } = req.body;

    // SQL query to insert the new product into the database
    const sql = `INSERT INTO products (category, product, price, location, warehouse) VALUES (?, ?, ?, ?, ?)`;
    const params = [category, product, price, location, warehouse];

    // Run the insert query
    db.run(sql, params, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Error adding the product');
        }

        // Redirect back to the product list after successful creation
        res.redirect('/products');
    });
});

//secret database can only be seen by a user has a active user session meaning they are logged in
const secretdb = new sqlite3.Database('secret.db');
app.get('/secret', (req, res) => {
    console.log('Fetching all products for secret page...');

    // Fetch all products from the database
    secretdb.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err.message);
            return res.status(500).send('Internal Server Error');
        }

        // Render the secret template with the fetched products
        res.render('secret', { products: rows });
    });
});

// Start the Server
app.listen(port, () => {
    console.log('Directory Name = ' + __dirname);
    console.log(`Server up and running, listening on port ${port} :)`);
});
