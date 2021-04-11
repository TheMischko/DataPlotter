const functions = {
  SMA20: (values) => simple_moving_average(values, 20),
  SMA50: (values) => simple_moving_average(values, 50),
  SMA100: (values) => simple_moving_average(values, 100),
  SMA500: (values) => simple_moving_average(values, 500),
  SMA1000: (values) => simple_moving_average(values, 500),
  x100: (values) => multiplyValues(values, 100)
}


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


const multiplyValues = (values, multiplicator) => {
  let values_new = [];
  for(let i = 0; i < values.length; i++)
    values_new.push({x: values[i].x, y: values[i].y*multiplicator});
  return values_new;
}

module.exports = functions;