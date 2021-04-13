/**************************************************************
 * DataFunctions.js
 * This module contains all mathematical, statistical and other
 * function that operates over given data.
 * These function are used when user wants to change data from
 * CSV file.
 *
 * Functions can be defined outside of this file but has to be
 * added to dictionary `functions` that is exported as module
 * and provides these function for other parts of application.
 **************************************************************/


/**
 * Dictionary of all defined function that changes values of given data.
 * @type {{
 * SMA20: (function({}[]): {}[]),
 * SMA500: (function({}[]): {}[]),
 * SMA1000: (function({}[]): {}[]),
 * SMA50: (function({}[]): {}[]),
 * SMA100: (function({}[]): {}[]),
 * x100: (function({}[]): {}[])}}
 */
const functions = {
  SMA20: (values) => simple_moving_average(values, 20),
  SMA50: (values) => simple_moving_average(values, 50),
  SMA100: (values) => simple_moving_average(values, 100),
  SMA500: (values) => simple_moving_average(values, 500),
  SMA1000: (values) => simple_moving_average(values, 500),
  x100: (values) => multiplyValues(values, 100)
}

/**
 * Calculates simple moving average for all y values.
 * @param values {{}[]} Array of values that are objects containing values x and y as properties.
 * @param a {Number} Number of surrounding values that are used in counting of SMA.
 * @return {[]} Array of values that are objects containing values x and y as properties.
 */
const simple_moving_average = (values, a) => {
  let values_new = [];
  for(let i = 0; i < values.length; i++){
    let n = 0;
    let sum = 0;
    for(let j = i; j < Math.floor(a/2); j++){
      if(typeof values[j] === "undefined")
        break;
      sum += Number(values[j].y);
      n++;
    }
    for(let j = i; j > i - Math.floor(a/2); j--){
      if(typeof values[j] === "undefined")
        break;
      sum += Number(values[j].y);
      n++;
    }
    values_new[i] = {x: values[i].x, y: (sum/n)};
  }
  return values_new;
}

/**
 * Multiplies all y values by given number.
 * @param values {{}[]} Array of values that are objects containing values x and y as properties.
 * @param multiplicator {Number} Number that is used in multiplication. New value = values[i].y * multiplicator.
 * @return {[]} Array of values that are objects containing values x and y as properties.
 */
const multiplyValues = (values, multiplicator) => {
  let values_new = [];
  for(let i = 0; i < values.length; i++)
    values_new.push({x: values[i].x, y: values[i].y*multiplicator});
  return values_new;
}

module.exports = functions;