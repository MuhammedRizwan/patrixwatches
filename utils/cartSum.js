const calculateSubtotal = (cart) => {
    let subtotal = 0;

    // Create a new array without the invalid items
    const validCart = cart.filter(cartItem => isValidProduct(cartItem.product));

    for (const cartItem of validCart) {
        subtotal += cartItem.product.discount_price * cartItem.quantity;
    }

    return subtotal;
};

const calculateProductTotal = (cart) => {
    const productTotals = [];

    for (const cartItem of cart) {
        if (isValidProduct(cartItem.product)) {
            const total = cartItem.product.discount_price * cartItem.quantity;
            productTotals.push(total);
        }
    }

    return productTotals;
}

function calculateDiscountedTotal(total, discountPercentage) {
    if (discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Discount percentage must be between 0 and 100.');
    }

    const discountAmount = (discountPercentage / 100) * total;
    const discountedTotal = total - discountAmount;

    return discountedTotal;
};

// Helper function to check if a product is valid (has stock)
const isValidProduct = (product) => {
    return product && product.discount_price && product.stock > 0;
};

module.exports = {
    calculateSubtotal,
    calculateProductTotal,
    calculateDiscountedTotal
}
