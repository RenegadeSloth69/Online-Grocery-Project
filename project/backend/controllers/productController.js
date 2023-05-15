const Product = require("../models/productModel")
const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const ApiFeatures = require("../utils/apifeatures")
const { isAuthenticatedUser } = require("../middleware/auth")
const User = require("../models/userModel")
const Cart = require("../models/cartModel")
const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init upload
const upload = multer({
  storage: storage,
}).single("image");

// get dashboard --admin
exports.addProductDash = catchAsyncErrors(async(req,res,next)=>{
  res.render("../../frontend/views/addProduct.pug")
})


// Create Product--admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  // Upload image
  upload(req, res, async function (err) {
    if (err) {
      return next(err);
    }

    // Create new product
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      image: {
        url: req.file.path.replace(/\\/g, '/'),
        contentType: req.file.mimetype,
      },
      user: req.user.id,
    });

    await product.save();

    const products = await Product.find();
    res.render("../../frontend/views/products.pug", { products });
  });
});


// Get all products

exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 8;
  const category = req.query.category;

  const Query = category
    ? Product.find({ category: category.replace(/-/g, ' ') }) // filter by category if category query parameter is present
    : Product.find(); // create a query object that returns all products if category query parameter is not present

  const apiFeature = new ApiFeatures(Query, req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  let products = await apiFeature.query;

  const productsCount = await Product.countDocuments();
  const filteredProductsCount = products.length;

  res.render('products', {
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
    req,
  });
});


// Get single product details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
  
    if (!product) {
      return next(new ErrorHandler("Product not found", 404))
    }
  
    res.render("../../frontend/views/productDetail.pug",{product:product, reviews:product.reviews})
})

// display all products for admin
exports.adminProduct = catchAsyncErrors(async(req,res,next)=>{
  const prods = await Product.find()
  res.render("../../frontend/views/admin-products.pug",{products:prods})
})

// redirect to update page
exports.productUpdateRedirect = catchAsyncErrors(async(req,res,next)=>{
  res.render("../../frontend/views/updateProduct.pug",{req})
})

// Update products--admin
exports.updateProduct = catchAsyncErrors(
    async(req,res,next)=>{
        let product = await Product.findById(req.params.id)
        
        if(!product){
            return next(new ErrorHandler("Product not found", 404))
        }
    
        product = await Product.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true,
            useFindAndModify:false
        })
    
        res.status(200).json({
            success:true,
            product
        })
    }
)

// Delete products
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
  
    if (!product) {
      return next(new ErrorHandler("Product not found", 404))
    }
    await Product.findByIdAndDelete(req.params.id) 

    res.redirect("/api/v1/admin/products")
})

// add to cart
exports.addToCart = catchAsyncErrors(async(req,res,next)=>{
  if(res.locals.isUserAuthenticated===false){
    res.redirect("/api/v1/login")
  }
  else{
    try {
      const user = req.user;
      const productId = req.body.productId;
      const quantity = req.body.quantity || 1;
  
      const cartItem = await Cart.findOne({ product: productId, user: user.id });
      if (cartItem) {
        // If the item already exists in the cart, update the quantity
        cartItem.quantity += quantity;
        await cartItem.save();
      } else {
        // If the item does not exist in the cart, create a new cart item
        await Cart.create({ product: productId, quantity, user: user.id });
      }
  
      res.redirect("/api/v1/cart");
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }
})

// display cart
exports.displayCart = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = req.user;
    let absTotal = 0

    const cartItems = await Cart.find({ user: user.id })
      .populate('product')
      .exec();

    const cart = [];
    let totalAmount = 0;

    // Combine cart items with the same product into a single cart item
    cartItems.forEach(cartItem => {
      const existingCartItem = cart.find(item => item.product._id.equals(cartItem.product._id));
      if (existingCartItem) {
        existingCartItem.quantity += cartItem.quantity;
      } else {
        cart.push(cartItem);
      }
      totalAmount += cartItem.product.price * cartItem.quantity;
    });

    absTotal = absTotal+totalAmount

    res.render('../../frontend/views/cart.pug', { cart, totalAmount, absTotal });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
}); 



// remove from cart
exports.removeFromCart = catchAsyncErrors(async(req,res,next)=>{
  try {
    const user = req.user;
    const cartItemId = req.params.id;

    const cartItem = await Cart.findOne({ _id: cartItemId, user: user.id });
    if (!cartItem) {
      return res.status(404).send('Cart item not found');
    }

    await Cart.deleteOne({_id:cartItemId});

    res.redirect("/api/v1/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
})

// update cart
exports.updateCart = catchAsyncErrors(async(req,res,next)=>{
  try {
    const user = req.user;
    const cartItemId = req.params.id;
    const quantity = req.body.quantity;

    const cartItem = await Cart.findOne({ _id: cartItemId, user: user.id });
    if (!cartItem) {
      return res.status(404).send('Cart item not found');
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.redirect("/api/v1/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
})

// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const { rating, comment } = req.body;

    const review = {
      user: req.user.id, // assuming you have user authentication implemented
      name:req.user.name,
      rating,
      comment
    };

    product.reviews.push(review);
    product.ratings = product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;
    product.numOfReviews = product.reviews.length;

    await product.save();

    res.redirect(`/api/v1/product/${product._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    console.log(req.params._id)
    const product = await Product.find(req.params._id);
  
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
  
    res.render("../../frontend/views/productDetail.pug",{product,reviews:product.reviews})
});