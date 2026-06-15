module.exports = (
  err,
  req,
  res,
  next
) => {

console.error(
  "SERVER ERROR:",
  err
);

res.status(500).json({

success:false,

error:
"Internal server error"

});

};