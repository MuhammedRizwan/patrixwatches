
 
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500; 
    let message = err.message || "Internal Server Error"; 

    // Handling duplicate key error (11000)
    if (err.code === 11000) {
        statusCode = 409; // Conflict
        message = `${Object.keys(err.keyValue)} should be unique`; // Construct message indicating which field(s) should be unique
    }

    if (err.name === "ValidationError") {
        statusCode = 400; 
        message = Object.values(err.errors)
            .map((value) => {
                if (value.kind === "Number") return `${value.path} should be a number`;
                return value.message; 
            })
            .join("\n");
    }

    console.error(err);

    const isFetch = req.headers["x-requested-with"] === "XMLHttpRequest";
    if (isFetch)
      res.status(statusCode).json({
        success: false,
        message: message,
      });
    else res.status(statusCode).render("errorPage", { message: message ,});
  };


module.exports = errorHandler;
