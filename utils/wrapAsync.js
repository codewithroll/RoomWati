module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// wrapAsync function basically try catch block ka kaam krta h bss yeh usse jyada efficeint hota h
