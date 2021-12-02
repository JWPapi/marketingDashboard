module.exports = () => {

  return (req, res, next) => {
    const generateIndexPage = async () => {
      res.render('index');
    };
    generateIndexPage().catch((err) => next(err));
  };
};
