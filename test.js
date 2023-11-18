const obj1 = {};
const obj2 = obj1;

obj1.name = "Bibou";

console.log(obj2);
console.log(obj1 === obj2);
