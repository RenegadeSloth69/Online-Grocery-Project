const express = require('express');
const app = express();
const errorMiddleware = require('./middleware/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const Product = require('./models/productModel')
const pug = require('pug');
const bodyParser = require('body-parser')
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());

//Route Imports
const product = require('./routes/productRoute');
const user = require('./routes/userRoute');
const order = require('./routes/orderRoute');
const { getAllProducts } = require('./controllers/productController');
const { isAuthenticatedUser} = require('./middleware/auth');
const { loginUser, logout } = require('./controllers/userController');

app.use('/api/v1', product);
app.use('/api/v1', user);
app.use('/api/v1', order);


// pug stuff
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware for error
app.use(errorMiddleware);

const compiledFunction = pug.compileFile(path.resolve(__dirname, '..', 'frontend', 'components', 'ProductCard', 'productCard.pug'));

// Route for the home page
app.get('/',isAuthenticatedUser, async (req, res) => {
  const products = await Product.find().sort({createdAt: -1}).limit(3);
  res.render('index', {products, compiledFunction});
});

module.exports = app;
