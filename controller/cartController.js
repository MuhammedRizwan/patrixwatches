const Cart = require('../model/cartModel');
const Product = require('../model/productModel');
const Address = require('../model/addressModel');

const addCart = async (req, res) => {
    try {
        const qty = req.body.qty;
        const id = req.query.id;
        const userId = req.session.user._id;
        const productData = await Product.findOne({ _id: id })
        if (productData.stock > qty) {
            const userCart = await Cart.findOne({ user_id: userId });
            if (userCart) {
                const cartItem = userCart.cartItems.find(item => item.product_id == id);
                if (cartItem) {
                    // Update the quantity for the found cart item
                    const updatedQuantity = cartItem.quantity + parseInt(qty);
                    cartItem.quantity = updatedQuantity;// Set `updatedQuantity` to the new quantity value
                } else {
                    userCart.cartItems.push({ product_id: id, quantity: qty, price: productData.salePrice }); // Add a new item to cartItems
                }
                await userCart.save();
            } else {
                const cart = new Cart({
                    user_id: userId,
                    cartItems: [
                        {
                            product_id: productData._id,
                            quantity: qty,
                            price: productData.salePrice
                        }
                    ],
                });
                const cartData = await cart.save();
            }
        }

        return res.redirect('/cartlist');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}
const cartPage = async (req, res) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const userId = req.session.user._id;// Assuming the user ID is available in req.user.user[0]._id
        const cartData = await Cart.findOne({ user_id: userId });
        if (!cartData) {
            return res.status(404).render('cartList', { cart: cartData, loggedIn });
        }
        // Fetch cart items based on the product_ids in the cart
        const productIds = cartData.cartItems.map(item => item.product_id);
        const productItems = await Product.find({ _id: { $in: productIds } });
        const cartItems = cartData.cartItems
        return res.render('cartList', { products: productItems, cart: cartData, cartData: cartItems, loggedIn });// Pass the cartItems data to the 'cart' EJS template
    } catch (error) {
        return res.status(500).send('Error fetching cart data');
    }
}


const addQuantity = async (req, res) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const id = req.query.id; // Corrected variable declaration
        const userId = req.session.user._id
        const cartData = await Cart.findOne({ user_id: userId }, { cartItems: 1, _id: 0 });
        const productStock = await Product.findOne({ _id: id }, { stock: 1, _id: 0 });
        if (!cartData) {
            return res.status(400).json({ success: false, message: "cart is not found" })
        } else {
            const foundItem = cartData.cartItems.find(item => item.product_id == id);
            const quantity = foundItem.quantity + 1;
            if (productStock.stock < quantity) {
                return res.status(400).json({ success: false, error: "Out of stock" });
            } else {
                const updateCart = await Cart.findOneAndUpdate(
                    { user_id: userId, 'cartItems.product_id': id },
                    { $inc: { 'cartItems.$.quantity': 1 } },
                    { new: true });
                if (updateCart) {
                    const cartItemData = updateCart.cartItems;// Assuming cartData contains the cartItems array
                    const matchingProduct = cartItemData
                        .filter(item => item.product_id == id);
                    return res.json(matchingProduct);
                } else {
                    return res.status(400).send("cart is not found ")
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};
const subQuantity = async (req, res) => {
    try {
        const loggedIn = req.session.user ? true : false;
        const id = req.query.id; // Corrected variable declaration
        const userId = req.session.user._id;
        const cartData = await Cart.findOne({ user_id: userId, 'cartItems.product_id': id });
        const cartDataItem = cartData.cartItems; // Access the first document and then get cartItems
        const existProduct = cartDataItem.find(item => item.product_id == id);
        if (existProduct.quantity < 2) {
            return res.status(200).json(cartData);
        } else {
            const updateCart = await Cart.findOneAndUpdate(
                { user_id: userId, 'cartItems.product_id': id },
                { $inc: { 'cartItems.$.quantity': -1 } },
                { new: true });
            if (updateCart) {
                const cartItemData = updateCart.cartItems;// Assuming cartData contains the cartItems array
                const matchingProduct = cartItemData
                    .filter(item => item.product_id == id);
                return res.json(matchingProduct)
            } else {
                return res.status(400).send("cart is not found ")
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};

const addCartIcon = async (req, res) => {
    try {
        const id = req.query.id; // Corrected variable declaration
        const productData = await Product.findById(id);
        if(productData.stock==0){
            return res.status(400).json({success:false,message:"Out Of Stock"})
        }
        const quantity = 1;
        const user_id = req.session.user._id;
        const userExist = await Cart.findOne({
            user_id: user_id, // Corrected to use user_id 
        });
        if (userExist) {
            const updateCart = await Cart.findOneAndUpdate(
                { user_id: user_id, 'cartItems.product_id': productData._id }, // Corrected to use user_id
                { $inc: { 'cartItems.$.quantity': quantity } },
                { new: true }
            );
            if (!updateCart) {
                // Create a new item to add to the cart
                const newItem = {
                    product_id: productData._id,
                    quantity: quantity,
                    price: productData.salePrice
                };

                // Update the existing cart's cartItems array by pushing the new item
                userExist.cartItems.push(newItem);
                // Save the changes to the existing cart
                await userExist.save();
            }
        } else {
            const cart = new Cart({
                user_id: user_id,
                cartItems: [
                    {
                        product_id: productData._id,
                        quantity: quantity,
                        price: productData.salePrice
                    }
                ]
            });
            await cart.save();
        }
        return res.status(200).json({ success: true, message: "Added to the cart" })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
};
const deleteCartItem = async (req, res) => {
    // Assuming you have an instance of Express set up as `app`

    const productId = req.query.id; // Get productId from the query parameter
    try {
        // Find the user's cart and remove the item where product_id matches
        const updatedCart = await Cart.findOneAndUpdate(
            { user_id: req.session.user._id },
            { $pull: { cartItems: { product_id: productId } } },
            { new: true }
        );

        if (!updatedCart) {
            console.log('Cart not found for the user.');
            // Handle the scenario where the cart is not found
        } else {
            return res.status(200).send(updatedCart);
        }
        // Respond with the updated cart
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
};
const checkOut = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const cartData = await Cart.findOne({ user_id: userId });
        if (cartData) {
            const addressData = await Address.findOne({ userId: userId });
            const cartItemData = cartData.cartItems;
            const productData = cartItemData.map(item => (item.product_id));
            const products = await Product.find({ _id: { $in: productData } })
            const loggedIn = req.session.user ? true : false;
            return res.status(200).render("checkOut", {
                loggedIn,
                // category: categoryData,
                Address: addressData,
                cart: cartItemData,
                product: products
            });
        }
        //const categoryData = await Category.find({ is_active: false });

    } catch (error) {
        console.error("Error in checkoutPage:", error);
        return res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    cartPage,
    addCart,
    addQuantity,
    subQuantity,
    addCartIcon,
    deleteCartItem,
    checkOut
}




