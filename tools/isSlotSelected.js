module.exports = function isSlotSelected(message){

return (
message.includes("Book this slot") &&
message.includes("T")
);

};